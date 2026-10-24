// src/app/api/deals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/security/rbac';
import { getDealById } from '@/server/services/dealService';
import { query } from '@/server/db/pool';
import { validateAndNormalizeRatio } from '@/server/domain/ratioRules';
import { recordAuditLog } from '@/server/services/auditService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const result = await getDealById(id, auth.user);

    if (!result) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();

    const existingRes = await query(`SELECT * FROM deals WHERE id = $1`, [id]);
    if (existingRes.rowCount === 0) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    const currentDeal = existingRes.rows[0];

    // Only owner BDM can edit, and only in DRAFT or NEEDS_CORRECTION
    if (auth.user.role !== 'BDM' || currentDeal.bdm_id !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only edit your own deals.' },
        { status: 403 }
      );
    }

    if (currentDeal.status !== 'DRAFT' && currentDeal.status !== 'NEEDS_CORRECTION') {
      return NextResponse.json(
        {
          error: `Cannot modify deal in status '${currentDeal.status}'. Only DRAFT or NEEDS_CORRECTION deals may be modified.`,
        },
        { status: 400 }
      );
    }

    // Ratio validation if changed
    const ratioResult = validateAndNormalizeRatio({
      ratio_type: body.ratio_type || currentDeal.ratio_type,
      company_percentage: body.company_percentage !== undefined ? body.company_percentage : currentDeal.company_percentage,
      college_percentage: body.college_percentage !== undefined ? body.college_percentage : currentDeal.college_percentage,
      agreement_value: body.agreement_value !== undefined ? body.agreement_value : currentDeal.agreement_value,
      currency: body.currency || currentDeal.currency,
      ratio_terms_description: body.ratio_terms_description !== undefined ? body.ratio_terms_description : currentDeal.ratio_terms_description,
    });

    if (!ratioResult.isValid) {
      return NextResponse.json(
        { error: `Invalid commercial terms: ${ratioResult.errors.join(' ')}` },
        { status: 400 }
      );
    }

    const updateRes = await query(
      `UPDATE deals 
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           business_category = COALESCE($4, business_category),
           ratio_type = $5,
           company_percentage = $6,
           college_percentage = $7,
           agreement_value = $8,
           currency = $9,
           ratio_terms_description = $10,
           contract_start_date = COALESCE($11, contract_start_date),
           contract_end_date = COALESCE($12, contract_end_date),
           terms_and_conditions = COALESCE($13, terms_and_conditions),
           additional_remarks = COALESCE($14, additional_remarks),
           business_ratio = COALESCE($15, business_ratio),
           version_number = version_number + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        body.title,
        body.description,
        body.business_category,
        ratioResult.normalized.ratio_type,
        ratioResult.normalized.company_percentage,
        ratioResult.normalized.college_percentage,
        ratioResult.normalized.agreement_value,
        ratioResult.normalized.currency,
        ratioResult.normalized.ratio_terms_description,
        body.contract_start_date,
        body.contract_end_date,
        body.terms_and_conditions,
        body.additional_remarks,
        body.business_ratio !== undefined ? (body.business_ratio ? String(body.business_ratio).trim() : null) : null,
      ]
    );

    const updated = updateRes.rows[0];

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'DEAL_UPDATED',
      entityName: 'deal',
      entityId: id,
      previousState: currentDeal,
      newState: updated,
      ipAddress: ip,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Update deal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update deal.' }, { status: 400 });
  }
}
