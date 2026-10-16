// scripts/seed.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bdm_platform',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seeding...');
    await client.query('BEGIN');

    // 1. Clean existing seed data safely if needed
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM hr_tasks');
    await client.query('DELETE FROM deal_status_history');
    await client.query('DELETE FROM deal_versions');
    await client.query('DELETE FROM deals');
    await client.query('DELETE FROM college_contacts');
    await client.query('DELETE FROM colleges');
    await client.query('DELETE FROM user_sessions');
    await client.query('DELETE FROM business_targets');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM audit_logs');

    // 2. Users with bcrypt hashed passwords
    const ceoHash = await bcrypt.hash('CeoPassword123!', 10);
    const hrHash = await bcrypt.hash('HrPassword123!', 10);
    const bdmHash = await bcrypt.hash('BdmPassword123!', 10);

    const ceoRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, phone)
      VALUES ('ceo@enterprise.edu', $1, 'Dr. Rajesh Nair', 'CEO', '+91 98765 43210')
      RETURNING id;
    `, [ceoHash]);
    const ceoId = ceoRes.rows[0].id;

    const hrRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, phone)
      VALUES ('hr@enterprise.edu', $1, 'Ananya Iyer', 'HR', '+91 98765 43211')
      RETURNING id;
    `, [hrHash]);
    const hrId = hrRes.rows[0].id;

    const bdm1Res = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, phone)
      VALUES ('bdm.vikram@enterprise.edu', $1, 'Vikram Sharma', 'BDM', '+91 98765 43212')
      RETURNING id;
    `, [bdmHash]);
    const bdm1Id = bdm1Res.rows[0].id;

    const bdm2Res = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, phone)
      VALUES ('bdm.priya@enterprise.edu', $1, 'Priya Patel', 'BDM', '+91 98765 43213')
      RETURNING id;
    `, [bdmHash]);
    const bdm2Id = bdm2Res.rows[0].id;

    // Targets
    await client.query(`
      INSERT INTO business_targets (user_id, period, target_deals_count)
      VALUES 
        ($1, '2026-Q4', 12),
        ($2, '2026-Q4', 10);
    `, [bdm1Id, bdm2Id]);

    // 3. Colleges
    const rvColRes = await client.query(`
      INSERT INTO colleges (legal_name, normalized_name, college_code, institution_type, affiliated_university, state, district, city, pin_code, address, website)
      VALUES (
        'RV College of Engineering', 'rv college of engineering', 'RVCE-BLR', 'Engineering', 'Visvesvaraya Technological University',
        'Karnataka', 'Bengaluru Urban', 'Bengaluru', '560059', 'Mysore Road, RV Vidyaniketan, Post, Bengaluru', 'https://www.rvce.edu.in'
      ) RETURNING id;
    `);
    const rvColId = rvColRes.rows[0].id;

    const iitColRes = await client.query(`
      INSERT INTO colleges (legal_name, normalized_name, college_code, institution_type, affiliated_university, state, district, city, pin_code, address, website)
      VALUES (
        'Indian Institute of Technology Madras', 'indian institute of technology madras', 'IITM-CHE', 'Autonomous University', 'Autonomous University',
        'Tamil Nadu', 'Chennai', 'Chennai', '600036', 'Sardar Patel Road, Chennai', 'https://www.iitm.ac.in'
      ) RETURNING id;
    `);
    const iitColId = iitColRes.rows[0].id;

    const coepColRes = await client.query(`
      INSERT INTO colleges (legal_name, normalized_name, college_code, institution_type, affiliated_university, state, district, city, pin_code, address, website)
      VALUES (
        'College of Engineering Pune', 'college of engineering pune', 'COEP-PUN', 'Engineering', 'COEP Technological University',
        'Maharashtra', 'Pune', 'Pune', '411005', 'Wellesley Road, Shivajinagar, Pune', 'https://www.coeptech.ac.in'
      ) RETURNING id;
    `);
    const coepColId = coepColRes.rows[0].id;

    const dtuColRes = await client.query(`
      INSERT INTO colleges (legal_name, normalized_name, college_code, institution_type, affiliated_university, state, district, city, pin_code, address, website)
      VALUES (
        'Delhi Technological University', 'delhi technological university', 'DTU-DEL', 'Autonomous University', 'Government of NCT of Delhi',
        'Delhi', 'North West Delhi', 'New Delhi', '110042', 'Shahbad Daulatpur, Bawana Road, Delhi', 'https://www.dtu.ac.in'
      ) RETURNING id;
    `);
    const dtuColId = dtuColRes.rows[0].id;

    // Contacts
    const c1Res = await client.query(`
      INSERT INTO college_contacts (college_id, full_name, designation, phone, email, is_primary)
      VALUES ($1, 'Dr. K. N. Subramanya', 'Principal & Director', '+91 94481 12345', 'principal@rvce.edu.in', true)
      RETURNING id;
    `, [rvColId]);
    const rvContactId = c1Res.rows[0].id;

    const c2Res = await client.query(`
      INSERT INTO college_contacts (college_id, full_name, designation, phone, email, is_primary)
      VALUES ($1, 'Prof. V. Kamakoti', 'Director', '+91 94440 54321', 'director@iitm.ac.in', true)
      RETURNING id;
    `, [iitColId]);
    const iitContactId = c2Res.rows[0].id;

    const c3Res = await client.query(`
      INSERT INTO college_contacts (college_id, full_name, designation, phone, email, is_primary)
      VALUES ($1, 'Dr. B. B. Ahuja', 'Dean of Academic Partnerships', '+91 98220 98765', 'dean.partnerships@coeptech.ac.in', true)
      RETURNING id;
    `, [coepColId]);
    const coepContactId = c3Res.rows[0].id;

    const c4Res = await client.query(`
      INSERT INTO college_contacts (college_id, full_name, designation, phone, email, is_primary)
      VALUES ($1, 'Dr. Pradeep Kumar', 'Head of Corporate Relations', '+91 98110 44556', 'corporate.relations@dtu.ac.in', true)
      RETURNING id;
    `, [dtuColId]);
    const dtuContactId = c4Res.rows[0].id;

    // 4. Deals in different verified states
    // Deal 1: APPROVED - RVCE
    const d1Res = await client.query(`
      INSERT INTO deals (
        deal_code, college_id, primary_contact_id, bdm_id, assigned_hr_id, title, description,
        business_category, status, ratio_type, company_percentage, college_percentage, agreement_value,
        currency, ratio_terms_description, contract_start_date, contract_end_date, terms_and_conditions,
        additional_remarks, submitted_at, reviewed_by, reviewed_at, review_remarks, version_number
      ) VALUES (
        'DEAL-2026-0001', $1, $2, $3, $4, 'Campus Recruitment Training 2026',
        'Comprehensive 120-hour technical skills and aptitude development program for pre-final year engineering students across CSE and ECE branches.',
        'Campus Recruitment Training', 'APPROVED', 'REVENUE_SHARE_PERCENTAGE', 70.00, 30.00, 1800000.00,
        'INR', '70% Company / 30% College revenue share calculated on gross enrolled candidate fees.',
        '2026-11-01', '2027-05-31', 'Payment milestone: 30% upon MoU signing, 40% mid-semester, 30% on program completion.',
        'Principal approved curriculum and lab facilities verified.', NOW() - INTERVAL '5 days', $5, NOW() - INTERVAL '3 days',
        'Commercial terms approved within standard margins.', 1
      ) RETURNING id;
    `, [rvColId, rvContactId, bdm1Id, hrId, ceoId]);
    const d1Id = d1Res.rows[0].id;

    await client.query(`
      INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
      VALUES 
        ($1, 'DRAFT', 'SUBMITTED', $2, 'Initial field submission', NOW() - INTERVAL '5 days'),
        ($1, 'SUBMITTED', 'APPROVED', $3, 'Commercial terms approved by CEO', NOW() - INTERVAL '3 days');
    `, [d1Id, bdm1Id, ceoId]);

    // HR Tasks for Deal 1
    await client.query(`
      INSERT INTO hr_tasks (deal_id, college_id, title, description, assigned_to, status, due_date, completed_at, internal_notes)
      VALUES 
        ($1, $2, 'MoU Signing & Legal Documentation', 'Collect signed MoU on college letterhead with stamp and execute bilateral legal filing.', $3, 'COMPLETED', CURRENT_DATE - 1, NOW() - INTERVAL '1 day', 'Signed copy scanned and verified.'),
        ($1, $2, 'Trainer Allocation & Schedule Finalization', 'Assign lead technical trainers and align weekend workshop schedule with college academic calendar.', $3, 'IN_PROGRESS', CURRENT_DATE + 5, NULL, 'Trainer availability confirmed with tech team.');
    `, [d1Id, rvColId, hrId]);

    // Deal 2: SUBMITTED - IIT Madras (Awaiting CEO Review)
    const d2Res = await client.query(`
      INSERT INTO deals (
        deal_code, college_id, primary_contact_id, bdm_id, title, description,
        business_category, status, ratio_type, company_percentage, college_percentage, agreement_value,
        currency, ratio_terms_description, contract_start_date, contract_end_date, terms_and_conditions,
        additional_remarks, submitted_at, version_number
      ) VALUES (
        'DEAL-2026-0002', $1, $2, $3, 'Center of Excellence in AI & Robotics',
        'Establishment of joint research and student certification hub in applied generative artificial intelligence and autonomous systems.',
        'Center of Excellence', 'SUBMITTED', 'REVENUE_SHARE_PERCENTAGE', 60.00, 40.00, 3500000.00,
        'INR', '60% Company / 40% College revenue sharing for external executive certifications.',
        '2026-12-01', '2028-11-30', 'Two-year multi-stage deployment with quarterly audit reports.',
        'Institutional sponsorship granted by research foundation.', NOW() - INTERVAL '1 day', 1
      ) RETURNING id;
    `, [iitColId, iitContactId, bdm1Id]);
    const d2Id = d2Res.rows[0].id;

    await client.query(`
      INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
      VALUES ($1, 'DRAFT', 'SUBMITTED', $2, 'Submitted for executive review', NOW() - INTERVAL '1 day');
    `, [d2Id, bdm1Id]);

    // Deal 3: UNDER_REVIEW - COEP Pune
    const d3Res = await client.query(`
      INSERT INTO deals (
        deal_code, college_id, primary_contact_id, bdm_id, title, description,
        business_category, status, ratio_type, college_percentage, agreement_value,
        currency, ratio_terms_description, contract_start_date, contract_end_date, terms_and_conditions,
        additional_remarks, submitted_at, version_number
      ) VALUES (
        'DEAL-2026-0003', $1, $2, $3, 'Full Stack Cloud Native Certification',
        'Certification track covering Microservices, Kubernetes, and Cloud Architecture for 300 engineering graduates.',
        'Joint Certification', 'UNDER_REVIEW', 'COLLEGE_COMMISSION_PERCENTAGE', 15.00, 1200000.00,
        'INR', 'Fixed 15% college institutional commission on total gross fee collection.',
        '2027-01-15', '2027-06-30', 'College provides computer laboratories and electricity.',
        'Co-branded certificates with college council.', NOW() - INTERVAL '2 days', 1
      ) RETURNING id;
    `, [coepColId, coepContactId, bdm2Id]);
    const d3Id = d3Res.rows[0].id;

    await client.query(`
      INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
      VALUES 
        ($1, 'DRAFT', 'SUBMITTED', $2, 'Submitted by BDM Priya', NOW() - INTERVAL '2 days'),
        ($1, 'SUBMITTED', 'UNDER_REVIEW', $3, 'CEO opened for commercial audit', NOW() - INTERVAL '12 hours');
    `, [d3Id, bdm2Id, ceoId]);

    // Deal 4: NEEDS_CORRECTION - DTU Delhi
    const d4Res = await client.query(`
      INSERT INTO deals (
        deal_code, college_id, primary_contact_id, bdm_id, title, description,
        business_category, status, ratio_type, company_percentage, agreement_value,
        currency, ratio_terms_description, contract_start_date, contract_end_date, terms_and_conditions,
        additional_remarks, submitted_at, reviewed_by, reviewed_at, review_remarks, version_number
      ) VALUES (
        'DEAL-2026-0004', $1, $2, $3, 'Faculty Development Program on Cyber Physical Systems',
        'Hands-on FDP for 45 faculty members with project incubation.',
        'Faculty Development', 'NEEDS_CORRECTION', 'COMPANY_SHARE_PERCENTAGE', 85.00, 650000.00,
        'INR', '85% retained by Company, 15% institutional overhead allowance.',
        '2026-11-20', '2026-12-05', 'Payment in 2 installments.',
        'Targeted for electrical and computer science faculty.', NOW() - INTERVAL '4 days',
        $4, NOW() - INTERVAL '1 day', 'Please attach Dean of Research authorization letter and clarify hardware kit delivery timeline.', 1
      ) RETURNING id;
    `, [dtuColId, dtuContactId, bdm1Id, ceoId]);
    const d4Id = d4Res.rows[0].id;

    await client.query(`
      INSERT INTO deal_status_history (deal_id, from_status, to_status, actor_id, reason, created_at)
      VALUES 
        ($1, 'DRAFT', 'SUBMITTED', $2, 'Initial submission', NOW() - INTERVAL '4 days'),
        ($1, 'SUBMITTED', 'NEEDS_CORRECTION', $3, 'Please attach Dean authorization letter', NOW() - INTERVAL '1 day');
    `, [d4Id, bdm1Id, ceoId]);

    // Notifications
    await client.query(`
      INSERT INTO notifications (user_id, title, message, category, reference_id, reference_type)
      VALUES 
        ($1, 'New Deal Submitted for Review', 'BDM Vikram Sharma submitted DEAL-2026-0002 for IIT Madras.', 'DEAL_SUBMITTED', $2, 'DEAL'),
        ($3, 'New Campus Partnership Deal Submitted', 'DEAL-2026-0002 for IIT Madras is awaiting review.', 'DEAL_SUBMITTED', $2, 'DEAL'),
        ($4, 'Deal Requires Correction', 'DEAL-2026-0004 for DTU returned: Please attach Dean authorization letter.', 'DEAL_REVIEWED', $5, 'DEAL');
    `, [ceoId, d2Id, hrId, bdm1Id, d4Id]);

    // Audit Log
    await client.query(`
      INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_name, entity_id, new_state, ip_address)
      VALUES 
        ($1, 'ceo@enterprise.edu', 'CEO', 'DEAL_APPROVED', 'deal', $2, '{"status": "APPROVED", "deal_code": "DEAL-2026-0001"}', '127.0.0.1'),
        ($3, 'bdm.vikram@enterprise.edu', 'BDM', 'DEAL_SUBMITTED', 'deal', $4, '{"status": "SUBMITTED", "deal_code": "DEAL-2026-0002"}', '127.0.0.1');
    `, [ceoId, d1Id, bdm1Id, d2Id]);

    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
    console.log('--- DEFAULT CREDENTIALS ---');
    console.log('👑 CEO: ceo@enterprise.edu / CeoPassword123!');
    console.log('👥 HR:  hr@enterprise.edu  / HrPassword123!');
    console.log('💼 BDM: bdm.vikram@enterprise.edu / BdmPassword123!');
    console.log('💼 BDM 2: bdm.priya@enterprise.edu / BdmPassword123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
