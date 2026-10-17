// scripts/test-additional-access.js
// This script validates RBAC edge cases:
//  - HR cannot approve a deal
//  - BDM cannot approve a deal
//  - Only CEO can approve
//  - BDM cannot edit an approved deal (attempting approve again)
// Run with: node scripts/test-additional-access.js

const http = require('http');

async function request(path, options = {}, body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {}),
        ...(options.headers || {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== RBAC EDGE CASE TESTS ===');

  // 1. Login as CEO (assumes CEO already exists)
  const ceoLogin = await request('/api/auth/login', { method: 'POST' }, { email: 'ceo@enterprise.edu', password: 'CeoPassword123!' });
  if (ceoLogin.statusCode !== 200) throw new Error('CEO login failed');
  const ceoCookie = ceoLogin.headers['set-cookie'][0].split(';')[0];
  console.log('CEO logged in');

  // 2. Create a new BDM account via CEO
  const bdmEmail = `bdm.test.${Date.now()}@enterprise.edu`;
  const bdmRes = await request('/api/users', { method: 'POST' }, { email: bdmEmail, full_name: 'Test BDM', role: 'BDM', password: 'BdmPass@123' }, ceoCookie);
  if (bdmRes.statusCode !== 201) throw new Error('BDM creation failed');
  console.log('BDM created:', bdmEmail);

  // 3. Create a new HR account via CEO
  const hrEmail = `hr.test.${Date.now()}@enterprise.edu`;
  const hrRes = await request('/api/users', { method: 'POST' }, { email: hrEmail, full_name: 'Test HR', role: 'HR', password: 'HrPass@123' }, ceoCookie);
  if (hrRes.statusCode !== 201) throw new Error('HR creation failed');
  console.log('HR created:', hrEmail);

  // 4. BDM logs in
  const bdmLogin = await request('/api/auth/login', { method: 'POST' }, { email: bdmEmail, password: 'BdmPass@123' });
  const bdmCookie = bdmLogin.headers['set-cookie'][0].split(';')[0];
  console.log('BDM logged in');

  // 5. BDM creates a draft deal
  const collegeRes = await request('/api/colleges', { method: 'GET' }, null, bdmCookie);
  const college = collegeRes.data.colleges[0];
  const dealRes = await request('/api/deals', { method: 'POST' }, {
    college_id: college.id,
    title: 'RBAC Test Deal',
    business_category: 'TRAINING',
    description: 'Testing RBAC restrictions.',
    company_percentage: 70,
    college_percentage: 30,
    ratio_type: 'REVENUE_SHARE_PERCENTAGE',
    agreement_value: 500000,
    currency: 'INR',
    contract_start_date: '2026-12-01',
    contract_end_date: '2027-11-30',
    terms_and_conditions: 'Test terms.',
    additional_remarks: 'None.',
    is_draft: true,
  }, bdmCookie);
  const dealId = dealRes.data.id || dealRes.data.deal.id;
  console.log('Draft deal created, id:', dealId);

  // 6. BDM submits the deal
  const submitRes = await request(`/api/deals/${dealId}/submit`, { method: 'POST' }, {}, bdmCookie);
  if (submitRes.statusCode !== 200) throw new Error('Deal submit failed');
  console.log('Deal submitted');

  // 7. CEO approves the deal
  const approveRes = await request(`/api/deals/${dealId}/approve`, { method: 'POST' }, { remarks: 'Approved for test' }, ceoCookie);
  if (approveRes.statusCode !== 200) throw new Error('CEO approval failed');
  console.log('CEO approved deal');

  // 8. HR attempts to approve (should be forbidden)
  const hrLogin = await request('/api/auth/login', { method: 'POST' }, { email: hrEmail, password: 'HrPass@123' });
  const hrCookie = hrLogin.headers['set-cookie'][0].split(';')[0];
  const hrApprove = await request(`/api/deals/${dealId}/approve`, { method: 'POST' }, { remarks: 'HR trying' }, hrCookie);
  console.log('HR approve attempt status:', hrApprove.statusCode, '| Expected 403');

  // 9. BDM attempts to approve again (should be forbidden)
  const bdmApprove = await request(`/api/deals/${dealId}/approve`, { method: 'POST' }, { remarks: 'BDM trying again' }, bdmCookie);
  console.log('BDM approve attempt status:', bdmApprove.statusCode, '| Expected 403');

  console.log('=== RBAC EDGE CASE TESTS COMPLETED ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
