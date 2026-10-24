// tests/integration/sprint2RbacAndRatio.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { query } from '../../src/server/db/pool';
import {
  createDeal,
  submitDeal,
  approveDeal,
  requestDealCorrection,
  rejectDeal,
  getDealById,
} from '../../src/server/services/dealService';
import { User, Deal } from '../../src/server/domain/types';
import { getOrCreateTestUser } from '../helpers/mockUser';

describe('Sprint 2: Offline Negotiated Ratio & Strict RBAC Enforcement', () => {
  let bdmUser1: User;
  let bdmUser2: User;
  let ceoUser: User;
  let hrUser: User;
  let testCollegeId: string;

  beforeAll(async () => {
    bdmUser1 = await getOrCreateTestUser('bdm.vikram@enterprise.edu', 'BDM', 'Vikram Sharma');
    bdmUser2 = await getOrCreateTestUser('bdm.priya@enterprise.edu', 'BDM', 'Priya Patel');
    ceoUser = await getOrCreateTestUser('ceo@enterprise.edu', 'CEO', 'Dr. Rajesh Nair');
    hrUser = await getOrCreateTestUser('hr@enterprise.edu', 'HR', 'Ananya Iyer');

    const colRes = await query<{ id: string }>(`SELECT id FROM colleges LIMIT 1`);
    if (colRes.rowCount && colRes.rowCount > 0) {
      testCollegeId = colRes.rows[0].id;
    } else {
      const newCol = await query<{ id: string }>(
        `INSERT INTO colleges (legal_name, normalized_name, college_code, institution_type, address)
         VALUES ('RV College of Engineering', 'rv college of engineering', 'RVCE-BLR', 'Engineering', 'Mysore Road, Bengaluru')
         RETURNING id`
      );
      testCollegeId = newCol.rows[0].id;
    }
  });

  it('Feature 1: BDM can manually input offline negotiated business ratio without automated overwrites', async () => {
    const negotiatedRatio = '70:30 (Offline Campus Negotiation)';
    const deal = await createDeal(
      {
        college_id: testCollegeId,
        title: 'AI & Data Science CoE Partnership',
        description: 'Comprehensive 4-year curriculum integration with negotiated revenue split.',
        business_category: 'Center of Excellence',
        business_ratio: negotiatedRatio,
        ratio_type: 'REVENUE_SHARE_PERCENTAGE',
        company_percentage: 70,
        college_percentage: 30,
        agreement_value: 3500000,
        currency: 'INR',
        contract_start_date: '2026-11-01',
        contract_end_date: '2027-10-31',
        is_draft: true,
      },
      bdmUser1
    );

    expect(deal.business_ratio).toBe(negotiatedRatio);

    // Verify persisted directly in database
    const dbCheck = await query<{ business_ratio: string }>(
      `SELECT business_ratio FROM deals WHERE id = $1`,
      [deal.id]
    );
    expect(dbCheck.rows[0].business_ratio).toBe(negotiatedRatio);
  });

  it('RBAC Enforcement 1: HR cannot approve deals (CEO exclusive authority)', async () => {
    const deal = await createDeal(
      {
        college_id: testCollegeId,
        title: 'Cyber Defense Training Initiative',
        description: 'Semester bootcamp.',
        business_category: 'Joint Certification',
        ratio_type: 'COLLEGE_COMMISSION_PERCENTAGE',
        college_percentage: 20,
        agreement_value: 1200000,
        currency: 'INR',
        is_draft: true,
      },
      bdmUser1
    );

    await submitDeal(deal.id, bdmUser1);

    // HR attempts approval -> Must be rejected by RBAC state machine
    await expect(approveDeal(deal.id, hrUser, 'HR attempting approval')).rejects.toThrow();
  });

  it('RBAC Enforcement 2: BDM cannot approve their own or any other deals', async () => {
    const deal = await createDeal(
      {
        college_id: testCollegeId,
        title: 'Full Stack Web Dev Certification',
        description: 'Certification cohort.',
        business_category: 'Campus Recruitment Training',
        ratio_type: 'REVENUE_SHARE_PERCENTAGE',
        company_percentage: 60,
        college_percentage: 40,
        agreement_value: 1500000,
        currency: 'INR',
        is_draft: true,
      },
      bdmUser1
    );

    await submitDeal(deal.id, bdmUser1);

    // BDM attempts approval -> Must be rejected
    await expect(approveDeal(deal.id, bdmUser1, 'BDM self-approval attempt')).rejects.toThrow();
  });

  it('RBAC Enforcement 3: HR cannot request correction or reject submitted deals', async () => {
    const deal = await createDeal(
      {
        college_id: testCollegeId,
        title: 'Cloud Architect Bootcamp',
        description: 'Cloud training.',
        business_category: 'Joint Certification',
        ratio_type: 'REVENUE_SHARE_PERCENTAGE',
        company_percentage: 65,
        college_percentage: 35,
        agreement_value: 1800000,
        currency: 'INR',
        is_draft: true,
      },
      bdmUser1
    );

    await submitDeal(deal.id, bdmUser1);

    // HR attempts correction request -> Rejected
    await expect(
      requestDealCorrection(deal.id, hrUser, 'HR requesting revision')
    ).rejects.toThrow();

    // HR attempts rejection -> Rejected
    await expect(rejectDeal(deal.id, hrUser, 'HR rejecting deal')).rejects.toThrow();
  });

  it('RBAC Lifecycle: CEO can request correction -> BDM edits & resubmits with updated ratio -> CEO approves', async () => {
    const initialRatio = '60:40 Negotiated';
    const revisedRatio = '70:30 Revised After Executive Review';

    // 1. BDM creates and submits
    const deal = await createDeal(
      {
        college_id: testCollegeId,
        title: 'Embedded Systems & IoT Lab',
        description: 'Initial proposal.',
        business_category: 'Lab Infrastructure',
        business_ratio: initialRatio,
        ratio_type: 'REVENUE_SHARE_PERCENTAGE',
        company_percentage: 60,
        college_percentage: 40,
        agreement_value: 2200000,
        currency: 'INR',
        is_draft: false,
      },
      bdmUser1
    );

    expect(deal.status).toBe('SUBMITTED');

    // 2. CEO requests correction
    const corrected = await requestDealCorrection(
      deal.id,
      ceoUser,
      'Increase company share to 70% per Q4 corporate margin requirements.'
    );
    expect(corrected.status).toBe('NEEDS_CORRECTION');

    // 3. Update deal with revised terms and revised manual ratio
    await query(
      `UPDATE deals 
       SET company_percentage = 70,
           college_percentage = 30,
           business_ratio = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [deal.id, revisedRatio]
    );

    // 4. BDM resubmits
    const resubmitted = await submitDeal(deal.id, bdmUser1);
    expect(resubmitted.status).toBe('SUBMITTED');

    // 5. CEO approves
    const approved = await approveDeal(deal.id, ceoUser, 'Revised terms accepted.');
    expect(approved.status).toBe('APPROVED');
    expect(approved.reviewed_by).toBe(ceoUser.id);

    // Verify final state
    const finalDeal = await getDealById(deal.id, ceoUser);
    expect(finalDeal).not.toBeNull();
    expect(finalDeal!.deal.business_ratio).toBe(revisedRatio);
    expect(finalDeal!.deal.status).toBe('APPROVED');
  });
});
