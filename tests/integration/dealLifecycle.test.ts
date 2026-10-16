// tests/integration/dealLifecycle.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { query } from '../../src/server/db/pool';
import { createDeal, submitDeal, approveDeal, listDeals, getDealById } from '../../src/server/services/dealService';
import { listHRTasks } from '../../src/server/services/hrTaskService';
import { getUserNotifications } from '../../src/server/services/notificationService';
import { User } from '../../src/server/domain/types';

describe('End-to-End Deal Lifecycle & Multi-Role Visibility', () => {
  let bdmUser1: User;
  let bdmUser2: User;
  let ceoUser: User;
  let hrUser: User;
  let testCollegeId: string;

  beforeAll(async () => {
    // Fetch seeded test users
    const bdm1Res = await query<User>(`SELECT * FROM users WHERE email = 'bdm.vikram@enterprise.edu'`);
    bdmUser1 = bdm1Res.rows[0];

    const bdm2Res = await query<User>(`SELECT * FROM users WHERE email = 'bdm.priya@enterprise.edu'`);
    bdmUser2 = bdm2Res.rows[0];

    const ceoRes = await query<User>(`SELECT * FROM users WHERE email = 'ceo@enterprise.edu'`);
    ceoUser = ceoRes.rows[0];

    const hrRes = await query<User>(`SELECT * FROM users WHERE email = 'hr@enterprise.edu'`);
    hrUser = hrRes.rows[0];

    const colRes = await query(`SELECT id FROM colleges LIMIT 1`);
    testCollegeId = colRes.rows[0].id;
  });

  it('Step 1: BDM creates a deal in DRAFT status', async () => {
    const draftDeal = await createDeal(
      {
        college_id: testCollegeId,
        title: 'Cloud DevOps Integration Program',
        description: 'Semester-long comprehensive DevOps boot camp and certification.',
        business_category: 'Joint Certification',
        ratio_type: 'REVENUE_SHARE_PERCENTAGE',
        company_percentage: 70,
        college_percentage: 30,
        agreement_value: 2000000,
        currency: 'INR',
        contract_start_date: '2026-12-01',
        contract_end_date: '2027-06-30',
        terms_and_conditions: 'Standard academic calendar delivery.',
        is_draft: true,
      },
      bdmUser1
    );

    expect(draftDeal.status).toBe('DRAFT');
    expect(draftDeal.submitted_at).toBeNull();
    expect(draftDeal.bdm_id).toBe(bdmUser1.id);
  });

  it('Step 2: BDM submits the deal -> Server generates trusted UTC timestamp', async () => {
    const created = await createDeal(
      {
        college_id: testCollegeId,
        title: 'Cybersecurity Analyst Specialization',
        description: 'Hands-on offensive and defensive cybersecurity training for 150 students.',
        business_category: 'Center of Excellence',
        ratio_type: 'REVENUE_SHARE_PERCENTAGE',
        company_percentage: 65,
        college_percentage: 35,
        agreement_value: 2500000,
        currency: 'INR',
        contract_start_date: '2026-11-15',
        contract_end_date: '2027-04-30',
        is_draft: true,
      },
      bdmUser1
    );

    const submitted = await submitDeal(created.id, bdmUser1);

    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.submitted_at).not.toBeNull();
    expect(new Date(submitted.submitted_at!).getTime()).toBeLessThanOrEqual(Date.now() + 5000);
  });

  it('Step 3: HR and CEO can view the submitted deal; BDM 2 cannot see BDM 1 deals', async () => {
    // BDM 1 deals list
    const bdm1List = await listDeals(bdmUser1, { search: 'Cybersecurity Analyst Specialization' });
    expect(bdm1List.deals.length).toBeGreaterThanOrEqual(1);

    // BDM 2 deals list (RBAC isolation)
    const bdm2List = await listDeals(bdmUser2, { search: 'Cybersecurity Analyst Specialization' });
    expect(bdm2List.deals.length).toBe(0);

    // HR deals list (can see all)
    const hrList = await listDeals(hrUser, { search: 'Cybersecurity Analyst Specialization' });
    expect(hrList.deals.length).toBeGreaterThanOrEqual(1);

    // CEO deals list (can see all)
    const ceoList = await listDeals(ceoUser, { search: 'Cybersecurity Analyst Specialization' });
    expect(ceoList.deals.length).toBeGreaterThanOrEqual(1);
  });

  it('Step 4: CEO approves the deal -> Triggers HR onboarding task and BDM notification', async () => {
    const deals = await listDeals(ceoUser, { search: 'Cybersecurity Analyst Specialization' });
    const targetDeal = deals.deals[0];

    const approved = await approveDeal(targetDeal.id, ceoUser, 'Commercial terms approved by Dr. Rajesh Nair');
    expect(approved.status).toBe('APPROVED');
    expect(approved.reviewed_by).toBe(ceoUser.id);

    // Verify HR task was automatically created
    const hrTasks = await listHRTasks({ dealId: targetDeal.id });
    expect(hrTasks.tasks.length).toBeGreaterThanOrEqual(1);
    expect(hrTasks.tasks[0].title).toContain('Campus Onboarding');

    // Verify BDM received notification
    const bdmNotifs = await getUserNotifications(bdmUser1.id);
    const approvedNotif = bdmNotifs.find((n) => n.reference_id === targetDeal.id && n.title.includes('Approved'));
    expect(approvedNotif).toBeDefined();
  });

  it('Step 5: IDOR Protection - BDM 2 cannot access BDM 1 deal detail', async () => {
    const deals = await listDeals(ceoUser, { search: 'Cybersecurity Analyst Specialization' });
    const targetDeal = deals.deals[0];

    await expect(getDealById(targetDeal.id, bdmUser2)).rejects.toThrow(
      'Forbidden. You do not have permission to view deals belonging to another BDM.'
    );
  });
});
