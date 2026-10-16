// src/server/services/kpiService.ts
import { query } from '../db/pool';
import { User } from '../domain/types';

export interface CeoKpiSummary {
  totalColleges: number;
  totalDeals: number;
  submittedDeals: number;
  underReviewDeals: number;
  approvedDeals: number;
  activeDeals: number;
  rejectedDeals: number;
  needsCorrectionDeals: number;
  completedDeals: number;
  approvalRatePercentage: number;
  totalAgreementValueInr: number;
  bdmPerformance: {
    bdmId: string;
    bdmName: string;
    email: string;
    totalDeals: number;
    approvedDeals: number;
    submittedDeals: number;
    rejectedDeals: number;
    totalValueInr: number;
  }[];
  stateDistribution: {
    state: string;
    collegesCount: number;
    dealsCount: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  hrOperationalSummary: {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
}

export interface BdmKpiSummary {
  totalCreated: number;
  draftsCount: number;
  submittedCount: number;
  underReviewCount: number;
  approvedCount: number;
  activeCount: number;
  rejectedCount: number;
  needsCorrectionCount: number;
  completedCount: number;
  totalAgreementValueInr: number;
  targetCount: number;
  achievedCount: number;
  targetCompletionPercentage: number;
}

export interface HrKpiSummary {
  newlySubmittedDealsCount: number;
  approvedDealsAwaitingOnboardingCount: number;
  totalActiveCollegesCount: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export async function getCeoKpis(): Promise<CeoKpiSummary> {
  // 1. College count
  const colRes = await query(`SELECT COUNT(*) as count FROM colleges`);
  const totalColleges = parseInt(colRes.rows[0].count, 10);

  // 2. Deal counts by status
  const dealStatusRes = await query<{ status: string; count: string; total_val: string }>(
    `SELECT status, COUNT(*) as count, COALESCE(SUM(agreement_value), 0) as total_val
     FROM deals
     GROUP BY status`
  );

  let totalDeals = 0;
  let submittedDeals = 0;
  let underReviewDeals = 0;
  let approvedDeals = 0;
  let activeDeals = 0;
  let rejectedDeals = 0;
  let needsCorrectionDeals = 0;
  let completedDeals = 0;
  let totalAgreementValueInr = 0;

  for (const row of dealStatusRes.rows) {
    const count = parseInt(row.count, 10);
    const val = parseFloat(row.total_val) || 0;
    totalDeals += count;

    switch (row.status) {
      case 'SUBMITTED':
        submittedDeals = count;
        break;
      case 'UNDER_REVIEW':
        underReviewDeals = count;
        break;
      case 'APPROVED':
        approvedDeals = count;
        totalAgreementValueInr += val;
        break;
      case 'ACTIVE':
        activeDeals = count;
        totalAgreementValueInr += val;
        break;
      case 'REJECTED':
        rejectedDeals = count;
        break;
      case 'NEEDS_CORRECTION':
        needsCorrectionDeals = count;
        break;
      case 'COMPLETED':
        completedDeals = count;
        totalAgreementValueInr += val;
        break;
    }
  }

  // Explicit approval rate definition:
  // Approved Decisions / Total Decided Decisions (Approved + Active + Completed + Rejected)
  const decidedCount = approvedDeals + activeDeals + completedDeals + rejectedDeals;
  const approvedTotal = approvedDeals + activeDeals + completedDeals;
  const approvalRatePercentage =
    decidedCount > 0 ? Math.round((approvedTotal / decidedCount) * 1000) / 10 : 0;

  // 3. BDM Performance
  const bdmRes = await query(
    `SELECT u.id as bdm_id, u.full_name as bdm_name, u.email,
            COUNT(d.id)::int as total_deals,
            COUNT(CASE WHEN d.status IN ('APPROVED', 'ACTIVE', 'COMPLETED') THEN 1 END)::int as approved_deals,
            COUNT(CASE WHEN d.status = 'SUBMITTED' THEN 1 END)::int as submitted_deals,
            COUNT(CASE WHEN d.status = 'REJECTED' THEN 1 END)::int as rejected_deals,
            COALESCE(SUM(CASE WHEN d.status IN ('APPROVED', 'ACTIVE', 'COMPLETED') THEN d.agreement_value ELSE 0 END), 0)::float as total_val
     FROM users u
     LEFT JOIN deals d ON d.bdm_id = u.id
     WHERE u.role = 'BDM'
     GROUP BY u.id
     ORDER BY approved_deals DESC, total_deals DESC`
  );

  const bdmPerformance = bdmRes.rows.map((r) => ({
    bdmId: r.bdm_id,
    bdmName: r.bdm_name,
    email: r.email,
    totalDeals: r.total_deals,
    approvedDeals: r.approved_deals,
    submittedDeals: r.submitted_deals,
    rejectedDeals: r.rejected_deals,
    totalValueInr: r.total_val,
  }));

  // 4. State distribution
  const stateRes = await query(
    `SELECT c.state,
            COUNT(DISTINCT c.id)::int as colleges_count,
            COUNT(DISTINCT d.id)::int as deals_count
     FROM colleges c
     LEFT JOIN deals d ON d.college_id = c.id
     GROUP BY c.state
     ORDER BY deals_count DESC, colleges_count DESC
     LIMIT 10`
  );

  const stateDistribution = stateRes.rows.map((r) => ({
    state: r.state,
    collegesCount: r.colleges_count,
    dealsCount: r.deals_count,
  }));

  // 5. Category distribution
  const catRes = await query(
    `SELECT business_category as category, COUNT(*)::int as count
     FROM deals
     GROUP BY business_category
     ORDER BY count DESC`
  );

  const categoryDistribution = catRes.rows.map((r) => ({
    category: r.category,
    count: r.count,
  }));

  // 6. HR tasks summary
  const taskRes = await query(
    `SELECT 
       COUNT(*)::int as total_tasks,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending_tasks,
       COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int as in_progress_tasks,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_tasks,
       COUNT(CASE WHEN status != 'COMPLETED' AND due_date < CURRENT_DATE THEN 1 END)::int as overdue_tasks
     FROM hr_tasks`
  );

  const taskRow = taskRes.rows[0];
  const hrOperationalSummary = {
    totalTasks: taskRow.total_tasks || 0,
    pendingTasks: taskRow.pending_tasks || 0,
    inProgressTasks: taskRow.in_progress_tasks || 0,
    completedTasks: taskRow.completed_tasks || 0,
    overdueTasks: taskRow.overdue_tasks || 0,
  };

  return {
    totalColleges,
    totalDeals,
    submittedDeals,
    underReviewDeals,
    approvedDeals,
    activeDeals,
    rejectedDeals,
    needsCorrectionDeals,
    completedDeals,
    approvalRatePercentage,
    totalAgreementValueInr,
    bdmPerformance,
    stateDistribution,
    categoryDistribution,
    hrOperationalSummary,
  };
}

export async function getBdmKpis(userId: string): Promise<BdmKpiSummary> {
  const dealStatusRes = await query<{ status: string; count: string; total_val: string }>(
    `SELECT status, COUNT(*) as count, COALESCE(SUM(agreement_value), 0) as total_val
     FROM deals
     WHERE bdm_id = $1
     GROUP BY status`,
    [userId]
  );

  let totalCreated = 0;
  let draftsCount = 0;
  let submittedCount = 0;
  let underReviewCount = 0;
  let approvedCount = 0;
  let activeCount = 0;
  let rejectedCount = 0;
  let needsCorrectionCount = 0;
  let completedCount = 0;
  let totalAgreementValueInr = 0;

  for (const row of dealStatusRes.rows) {
    const count = parseInt(row.count, 10);
    const val = parseFloat(row.total_val) || 0;
    totalCreated += count;

    switch (row.status) {
      case 'DRAFT':
        draftsCount = count;
        break;
      case 'SUBMITTED':
        submittedCount = count;
        break;
      case 'UNDER_REVIEW':
        underReviewCount = count;
        break;
      case 'APPROVED':
        approvedCount = count;
        totalAgreementValueInr += val;
        break;
      case 'ACTIVE':
        activeCount = count;
        totalAgreementValueInr += val;
        break;
      case 'REJECTED':
        rejectedCount = count;
        break;
      case 'NEEDS_CORRECTION':
        needsCorrectionCount = count;
        break;
      case 'COMPLETED':
        completedCount = count;
        totalAgreementValueInr += val;
        break;
    }
  }

  // Target query
  const targetRes = await query(
    `SELECT target_deals_count FROM business_targets WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const targetCount = targetRes.rowCount && targetRes.rowCount > 0 ? targetRes.rows[0].target_deals_count : 10;
  const achievedCount = approvedCount + activeCount + completedCount;
  const targetCompletionPercentage =
    targetCount > 0 ? Math.min(100, Math.round((achievedCount / targetCount) * 100)) : 0;

  return {
    totalCreated,
    draftsCount,
    submittedCount,
    underReviewCount,
    approvedCount,
    activeCount,
    rejectedCount,
    needsCorrectionCount,
    completedCount,
    totalAgreementValueInr,
    targetCount,
    achievedCount,
    targetCompletionPercentage,
  };
}

export async function getHrKpis(): Promise<HrKpiSummary> {
  const submittedRes = await query(
    `SELECT COUNT(*)::int as count FROM deals WHERE status = 'SUBMITTED'`
  );
  const newlySubmittedDealsCount = submittedRes.rows[0].count;

  const awaitingOnboardingRes = await query(
    `SELECT COUNT(*)::int as count 
     FROM deals d
     WHERE d.status = 'APPROVED'
       AND NOT EXISTS (
         SELECT 1 FROM hr_tasks t WHERE t.deal_id = d.id AND t.status = 'COMPLETED'
       )`
  );
  const approvedDealsAwaitingOnboardingCount = awaitingOnboardingRes.rows[0].count;

  const activeCollegesRes = await query(
    `SELECT COUNT(DISTINCT college_id)::int as count FROM deals WHERE status IN ('APPROVED', 'ACTIVE')`
  );
  const totalActiveCollegesCount = activeCollegesRes.rows[0].count;

  const taskRes = await query(
    `SELECT 
       COUNT(*)::int as total_tasks,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending_tasks,
       COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int as in_progress_tasks,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_tasks,
       COUNT(CASE WHEN status != 'COMPLETED' AND due_date < CURRENT_DATE THEN 1 END)::int as overdue_tasks
     FROM hr_tasks`
  );

  const t = taskRes.rows[0];

  return {
    newlySubmittedDealsCount,
    approvedDealsAwaitingOnboardingCount,
    totalActiveCollegesCount,
    totalTasks: t.total_tasks || 0,
    pendingTasks: t.pending_tasks || 0,
    inProgressTasks: t.in_progress_tasks || 0,
    completedTasks: t.completed_tasks || 0,
    overdueTasks: t.overdue_tasks || 0,
  };
}
