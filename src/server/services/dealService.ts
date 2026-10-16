// src/server/services/dealService.ts
import { query, withTransaction } from '../db/pool';
import { Deal, DealStatus, RatioType, User, UserRole, DealStatusHistory } from '../domain/types';
import { validateAndNormalizeRatio, RatioValidationInput } from '../domain/ratioRules';
import { validateStateTransition } from '../domain/dealStateMachine';
import { recordAuditLog } from './auditService';
import { createNotification, notifyUsersByRole } from './notificationService';

export interface CreateDealInput {
  college_id: string;
  primary_contact_id?: string | null;
  title: string;
  description: string;
  business_category: string;
  ratio_type: RatioType;
  company_percentage?: number | null;
  college_percentage?: number | null;
  agreement_value?: number | null;
  currency?: string;
  ratio_terms_description?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  terms_and_conditions?: string | null;
  additional_remarks?: string | null;
  is_draft?: boolean;
}

export interface UpdateDealInput extends Partial<CreateDealInput> {
  id: string;
}

export async function generateDealCode(): Promise<string> {
  const year = new Date().getFullYear();
  const res = await query(
    `SELECT COUNT(*) as count FROM deals WHERE deal_code LIKE $1`,
    [`DEAL-${year}-%`]
  );
  const nextNum = parseInt(res.rows[0].count, 10) + 1;
  return `DEAL-${year}-${String(nextNum).padStart(4, '0')}`;
}

export async function createDeal(input: CreateDealInput, user: User, clientIp?: string): Promise<Deal> {
  if (user.role !== 'BDM') {
    throw new Error('Only BDM employees are authorized to create new business deals.');
  }

  // Validate ratio rules
  const ratioResult = validateAndNormalizeRatio({
    ratio_type: input.ratio_type,
    company_percentage: input.company_percentage,
    college_percentage: input.college_percentage,
    agreement_value: input.agreement_value,
    currency: input.currency,
    ratio_terms_description: input.ratio_terms_description,
  });

  if (!ratioResult.isValid && !input.is_draft) {
    throw new Error(`Invalid commercial terms: ${ratioResult.errors.join(' ')}`);
  }

  const initialStatus: DealStatus = input.is_draft ? 'DRAFT' : 'SUBMITTED';

  return withTransaction(async (client) => {
    const dealCode = await generateDealCode();

    const insertRes = await client.query<Deal>(
      `INSERT INTO deals (
        deal_code, college_id, primary_contact_id, bdm_id, title, description,
        business_category, status, ratio_type, company_percentage, college_percentage,
        agreement_value, currency, ratio_terms_description, contract_start_date,
        contract_end_date, terms_and_conditions, additional_remarks,
        submitted_at, version_number, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        ${initialStatus === 'SUBMITTED' ? 'NOW()' : 'NULL'},
        1, NOW(), NOW()
      ) RETURNING *`,
      [
        dealCode,
        input.college_id,
        input.primary_contact_id || null,
        user.id,
        input.title.trim(),
        input.description.trim(),
        input.business_category.trim(),
        initialStatus,
        ratioResult.normalized.ratio_type,
        ratioResult.normalized.company_percentage,
        ratioResult.normalized.college_percentage,
        ratioResult.normalized.agreement_value,
        ratioResult.normalized.currency,
        ratioResult.normalized.ratio_terms_description,
        input.contract_start_date || null,
        input.contract_end_date || null,
        input.terms_and_conditions?.trim() || null,
        input.additional_remarks?.trim() || null,
      ]
    );

    const deal = insertRes.rows[0];

    // Status history
    await client.query(
      `INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
       VALUES ($1, NULL, $2, $3, $4, NOW())`,
      [deal.id, initialStatus, user.id, input.is_draft ? 'Deal saved as draft' : 'Initial deal submission']
    );

    // Initial version
    await client.query(
      `INSERT INTO deal_versions (deal_id, version_number, snapshot, modified_by, reason, created_at)
       VALUES ($1, 1, $2, $3, $4, NOW())`,
      [deal.id, JSON.stringify(deal), user.id, 'Initial record creation']
    );

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: input.is_draft ? 'DEAL_DRAFT_CREATED' : 'DEAL_SUBMITTED',
      entityName: 'deal',
      entityId: deal.id,
      newState: deal,
      ipAddress: clientIp,
    });

    if (initialStatus === 'SUBMITTED') {
      // Automatic notifications to CEO & HR
      await notifyUsersByRole('CEO', {
        title: 'New College Deal Submitted',
        message: `${user.full_name} submitted deal ${deal.deal_code} (${deal.title}) for executive review.`,
        category: 'DEAL_SUBMITTED',
        referenceId: deal.id,
        referenceType: 'DEAL',
      });

      await notifyUsersByRole('HR', {
        title: 'New College Partnership Submitted',
        message: `Deal ${deal.deal_code} (${deal.title}) has been submitted and is in pipeline.`,
        category: 'DEAL_SUBMITTED',
        referenceId: deal.id,
        referenceType: 'DEAL',
      });
    }

    return deal;
  });
}

export async function submitDeal(dealId: string, user: User, clientIp?: string): Promise<Deal> {
  return withTransaction(async (client) => {
    const existingRes = await client.query<Deal>(`SELECT * FROM deals WHERE id = $1 FOR UPDATE`, [dealId]);
    if (existingRes.rowCount === 0) {
      throw new Error('Deal not found.');
    }

    const currentDeal = existingRes.rows[0];

    // Check transition validity
    const transitionCheck = validateStateTransition({
      fromStatus: currentDeal.status,
      toStatus: 'SUBMITTED',
      actorRole: user.role,
      isOwnerBDM: currentDeal.bdm_id === user.id,
    });

    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.error || 'State transition forbidden.');
    }

    // Validate ratio requirements
    const ratioResult = validateAndNormalizeRatio({
      ratio_type: currentDeal.ratio_type,
      company_percentage: currentDeal.company_percentage,
      college_percentage: currentDeal.college_percentage,
      agreement_value: currentDeal.agreement_value,
      currency: currentDeal.currency,
      ratio_terms_description: currentDeal.ratio_terms_description,
    });

    if (!ratioResult.isValid) {
      throw new Error(`Cannot submit deal: Commercial ratio validation failed (${ratioResult.errors.join(' ')})`);
    }

    const updateRes = await client.query<Deal>(
      `UPDATE deals 
       SET status = 'SUBMITTED',
           submitted_at = NOW(),
           version_number = version_number + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dealId]
    );

    const updatedDeal = updateRes.rows[0];

    // Status history
    await client.query(
      `INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
       VALUES ($1, $2, 'SUBMITTED', $3, 'Submitted for executive review', NOW())`,
      [dealId, currentDeal.status, user.id]
    );

    // Version snapshot
    await client.query(
      `INSERT INTO deal_versions (deal_id, version_number, snapshot, modified_by, reason, created_at)
       VALUES ($1, $2, $3, $4, 'Deal submitted', NOW())`,
      [dealId, updatedDeal.version_number, JSON.stringify(updatedDeal), user.id]
    );

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEAL_SUBMITTED',
      entityName: 'deal',
      entityId: dealId,
      previousState: { status: currentDeal.status },
      newState: { status: 'SUBMITTED', submitted_at: updatedDeal.submitted_at },
      ipAddress: clientIp,
    });

    // Notify CEO & HR
    await notifyUsersByRole('CEO', {
      title: 'College Deal Submitted for Review',
      message: `${user.full_name} submitted deal ${updatedDeal.deal_code} (${updatedDeal.title}).`,
      category: 'DEAL_SUBMITTED',
      referenceId: dealId,
      referenceType: 'DEAL',
    });

    await notifyUsersByRole('HR', {
      title: 'New College Deal Submitted',
      message: `Deal ${updatedDeal.deal_code} submitted by ${user.full_name}.`,
      category: 'DEAL_SUBMITTED',
      referenceId: dealId,
      referenceType: 'DEAL',
    });

    return updatedDeal;
  });
}

export async function reviewDeal(dealId: string, user: User, clientIp?: string): Promise<Deal> {
  return withTransaction(async (client) => {
    const existingRes = await client.query<Deal>(`SELECT * FROM deals WHERE id = $1 FOR UPDATE`, [dealId]);
    if (existingRes.rowCount === 0) throw new Error('Deal not found.');
    const currentDeal = existingRes.rows[0];

    const transitionCheck = validateStateTransition({
      fromStatus: currentDeal.status,
      toStatus: 'UNDER_REVIEW',
      actorRole: user.role,
      isOwnerBDM: false,
    });

    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.error || 'Transition forbidden.');
    }

    const updateRes = await client.query<Deal>(
      `UPDATE deals 
       SET status = 'UNDER_REVIEW',
           reviewed_by = $2,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dealId, user.id]
    );
    const updatedDeal = updateRes.rows[0];

    await client.query(
      `INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
       VALUES ($1, $2, 'UNDER_REVIEW', $3, 'Executive review initiated', NOW())`,
      [dealId, currentDeal.status, user.id]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEAL_UNDER_REVIEW',
      entityName: 'deal',
      entityId: dealId,
      ipAddress: clientIp,
    });

    return updatedDeal;
  });
}

export async function approveDeal(
  dealId: string,
  user: User,
  remarks?: string,
  clientIp?: string
): Promise<Deal> {
  return withTransaction(async (client) => {
    const existingRes = await client.query<Deal>(`SELECT * FROM deals WHERE id = $1 FOR UPDATE`, [dealId]);
    if (existingRes.rowCount === 0) throw new Error('Deal not found.');
    const currentDeal = existingRes.rows[0];

    const transitionCheck = validateStateTransition({
      fromStatus: currentDeal.status,
      toStatus: 'APPROVED',
      actorRole: user.role,
      isOwnerBDM: false,
      reason: remarks,
    });

    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.error || 'Transition forbidden.');
    }

    const updateRes = await client.query<Deal>(
      `UPDATE deals 
       SET status = 'APPROVED',
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_remarks = $3,
           version_number = version_number + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dealId, user.id, remarks?.trim() || 'Approved by CEO']
    );
    const updatedDeal = updateRes.rows[0];

    await client.query(
      `INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
       VALUES ($1, $2, 'APPROVED', $3, $4, NOW())`,
      [dealId, currentDeal.status, user.id, remarks?.trim() || 'Approved by CEO']
    );

    // Initial HR Task created automatically upon deal approval!
    await client.query(
      `INSERT INTO hr_tasks (deal_id, college_id, title, description, status, due_date, created_at, updated_at)
       VALUES ($1, $2, 'Initiate Campus Onboarding & MoU Signoff', 'Coordinate with college representative for MoU execution and trainer scheduling.', 'PENDING', CURRENT_DATE + 7, NOW(), NOW())`,
      [dealId, updatedDeal.college_id]
    );

    // Version
    await client.query(
      `INSERT INTO deal_versions (deal_id, version_number, snapshot, modified_by, reason, created_at)
       VALUES ($1, $2, $3, $4, 'Deal approved', NOW())`,
      [dealId, updatedDeal.version_number, JSON.stringify(updatedDeal), user.id]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEAL_APPROVED',
      entityName: 'deal',
      entityId: dealId,
      previousState: { status: currentDeal.status },
      newState: { status: 'APPROVED', reviewed_by: user.id, review_remarks: remarks },
      ipAddress: clientIp,
    });

    // Notify BDM
    await createNotification({
      userId: updatedDeal.bdm_id,
      title: 'Deal Approved! 🎉',
      message: `Your deal ${updatedDeal.deal_code} (${updatedDeal.title}) has been approved by ${user.full_name}.`,
      category: 'DEAL_REVIEWED',
      referenceId: dealId,
      referenceType: 'DEAL',
    });

    // Notify HR
    await notifyUsersByRole('HR', {
      title: 'New Approved Deal Ready for Onboarding',
      message: `Deal ${updatedDeal.deal_code} approved. Campus onboarding task created.`,
      category: 'TASK_ASSIGNED',
      referenceId: dealId,
      referenceType: 'DEAL',
    });

    return updatedDeal;
  });
}

export async function rejectDeal(
  dealId: string,
  user: User,
  reason: string,
  clientIp?: string
): Promise<Deal> {
  return withTransaction(async (client) => {
    const existingRes = await client.query<Deal>(`SELECT * FROM deals WHERE id = $1 FOR UPDATE`, [dealId]);
    if (existingRes.rowCount === 0) throw new Error('Deal not found.');
    const currentDeal = existingRes.rows[0];

    const transitionCheck = validateStateTransition({
      fromStatus: currentDeal.status,
      toStatus: 'REJECTED',
      actorRole: user.role,
      isOwnerBDM: false,
      reason,
    });

    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.error || 'Transition forbidden.');
    }

    const updateRes = await client.query<Deal>(
      `UPDATE deals 
       SET status = 'REJECTED',
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_remarks = $3,
           version_number = version_number + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dealId, user.id, reason.trim()]
    );
    const updatedDeal = updateRes.rows[0];

    await client.query(
      `INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
       VALUES ($1, $2, 'REJECTED', $3, $4, NOW())`,
      [dealId, currentDeal.status, user.id, reason.trim()]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEAL_REJECTED',
      entityName: 'deal',
      entityId: dealId,
      previousState: { status: currentDeal.status },
      newState: { status: 'REJECTED', review_remarks: reason },
      ipAddress: clientIp,
    });

    await createNotification({
      userId: updatedDeal.bdm_id,
      title: 'Deal Rejected',
      message: `Deal ${updatedDeal.deal_code} was rejected. Reason: ${reason}`,
      category: 'DEAL_REVIEWED',
      referenceId: dealId,
      referenceType: 'DEAL',
    });

    return updatedDeal;
  });
}

export async function requestDealCorrection(
  dealId: string,
  user: User,
  remarks: string,
  clientIp?: string
): Promise<Deal> {
  return withTransaction(async (client) => {
    const existingRes = await client.query<Deal>(`SELECT * FROM deals WHERE id = $1 FOR UPDATE`, [dealId]);
    if (existingRes.rowCount === 0) throw new Error('Deal not found.');
    const currentDeal = existingRes.rows[0];

    const transitionCheck = validateStateTransition({
      fromStatus: currentDeal.status,
      toStatus: 'NEEDS_CORRECTION',
      actorRole: user.role,
      isOwnerBDM: false,
      reason: remarks,
    });

    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.error || 'Transition forbidden.');
    }

    const updateRes = await client.query<Deal>(
      `UPDATE deals 
       SET status = 'NEEDS_CORRECTION',
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_remarks = $3,
           version_number = version_number + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dealId, user.id, remarks.trim()]
    );
    const updatedDeal = updateRes.rows[0];

    await client.query(
      `INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
       VALUES ($1, $2, 'NEEDS_CORRECTION', $3, $4, NOW())`,
      [dealId, currentDeal.status, user.id, remarks.trim()]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEAL_NEEDS_CORRECTION',
      entityName: 'deal',
      entityId: dealId,
      previousState: { status: currentDeal.status },
      newState: { status: 'NEEDS_CORRECTION', review_remarks: remarks },
      ipAddress: clientIp,
    });

    await createNotification({
      userId: updatedDeal.bdm_id,
      title: 'Deal Requires Correction',
      message: `Deal ${updatedDeal.deal_code} has been returned for correction: ${remarks}`,
      category: 'DEAL_REVIEWED',
      referenceId: dealId,
      referenceType: 'DEAL',
    });

    return updatedDeal;
  });
}

export async function listDeals(
  user: User,
  options?: {
    status?: DealStatus | 'ALL';
    collegeId?: string;
    bdmId?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ deals: Deal[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // RBAC Tenancy Enforcement:
  // BDM users see ONLY their own deals
  if (user.role === 'BDM') {
    conditions.push(`d.bdm_id = $${paramIdx++}`);
    params.push(user.id);
  } else if (options?.bdmId) {
    conditions.push(`d.bdm_id = $${paramIdx++}`);
    params.push(options.bdmId);
  }

  if (options?.status && options.status !== 'ALL') {
    conditions.push(`d.status = $${paramIdx++}`);
    params.push(options.status);
  }

  if (options?.collegeId) {
    conditions.push(`d.college_id = $${paramIdx++}`);
    params.push(options.collegeId);
  }

  if (options?.category) {
    conditions.push(`d.business_category = $${paramIdx++}`);
    params.push(options.category);
  }

  if (options?.search) {
    conditions.push(`(d.title ILIKE $${paramIdx} OR d.deal_code ILIKE $${paramIdx} OR c.legal_name ILIKE $${paramIdx})`);
    params.push(`%${options.search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const countRes = await query(
    `SELECT COUNT(*) as count 
     FROM deals d 
     JOIN colleges c ON d.college_id = c.id 
     ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataRes = await query<Deal>(
    `SELECT d.*, 
            c.legal_name as college_name,
            c.city as college_city,
            c.state as college_state,
            cc.full_name as contact_name,
            cc.email as contact_email,
            cc.phone as contact_phone,
            u.full_name as bdm_name,
            u.email as bdm_email,
            rev.full_name as reviewer_name
     FROM deals d
     JOIN colleges c ON d.college_id = c.id
     LEFT JOIN college_contacts cc ON d.primary_contact_id = cc.id
     JOIN users u ON d.bdm_id = u.id
     LEFT JOIN users rev ON d.reviewed_by = rev.id
     ${whereClause}
     ORDER BY d.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { deals: dataRes.rows, total };
}

export async function getDealById(dealId: string, user: User): Promise<{
  deal: Deal;
  history: DealStatusHistory[];
  tasks: any[];
} | null> {
  const res = await query<Deal>(
    `SELECT d.*, 
            c.legal_name as college_name,
            c.city as college_city,
            c.state as college_state,
            c.website as college_website,
            cc.full_name as contact_name,
            cc.designation as contact_designation,
            cc.email as contact_email,
            cc.phone as contact_phone,
            u.full_name as bdm_name,
            u.email as bdm_email,
            rev.full_name as reviewer_name
     FROM deals d
     JOIN colleges c ON d.college_id = c.id
     LEFT JOIN college_contacts cc ON d.primary_contact_id = cc.id
     JOIN users u ON d.bdm_id = u.id
     LEFT JOIN users rev ON d.reviewed_by = rev.id
     WHERE d.id = $1`,
    [dealId]
  );

  if (res.rowCount === 0) return null;
  const deal = res.rows[0];

  // RBAC ownership check
  if (user.role === 'BDM' && deal.bdm_id !== user.id) {
    throw new Error('Forbidden. You do not have permission to view deals belonging to another BDM.');
  }

  // Get status history
  const historyRes = await query<DealStatusHistory>(
    `SELECT h.*, u.full_name as actor_name, u.email as actor_email, u.role as actor_role
     FROM deal_status_history h
     JOIN users u ON h.actor_id = u.id
     WHERE h.deal_id = $1
     ORDER BY h.created_at ASC`,
    [dealId]
  );

  // Get HR tasks
  const tasksRes = await query(
    `SELECT t.*, u.full_name as assigned_name
     FROM hr_tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.deal_id = $1
     ORDER BY t.created_at DESC`,
    [dealId]
  );

  return {
    deal,
    history: historyRes.rows,
    tasks: tasksRes.rows,
  };
}
