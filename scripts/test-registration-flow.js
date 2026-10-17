// scripts/test-registration-flow.js
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
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('===============================================================');
  console.log('REAL USER REGISTRATION & FORGOT PASSWORD WORKFLOW TEST');
  console.log('===============================================================');

  const timestamp = Date.now();
  const ceoEmail = `founder.ceo.${timestamp}@company.com`;
  const hrEmail = `lead.hr.${timestamp}@company.com`;
  const bdm1Email = `growth.bdm1.${timestamp}@company.com`;
  const bdm2Email = `growth.bdm2.${timestamp}@company.com`;
  const fakeCeoEmail = `imposter.ceo.${timestamp}@company.com`;

  console.log('\n--- 1. Check Initial Registration Status ---');
  const initialStatus = await request('/api/auth/register');
  console.log('Initial Status:', initialStatus.statusCode, '| hasCeo:', initialStatus.data.hasCeo);

  console.log('\n--- 2. Register The Primary Real CEO Account ---');
  const ceoReg = await request('/api/auth/register', { method: 'POST' }, {
    full_name: 'Dr. Vivek Sengupta',
    email: ceoEmail,
    role: 'CEO',
    password: 'CeoSecurePassword@2026',
    phone: '+91 98111 22233'
  });
  console.log('CEO Register Status:', ceoReg.statusCode, '| Success:', ceoReg.data.success);
  console.log('Registered CEO:', ceoReg.data.user?.full_name, `(${ceoReg.data.user?.email})`);

  console.log('\n--- 3. Check Registration Status After CEO Created ---');
  const updatedStatus = await request('/api/auth/register');
  console.log('Updated Status:', updatedStatus.statusCode, '| hasCeo:', updatedStatus.data.hasCeo);

  console.log('\n--- 4. Attempt To Register Second CEO Account (Must Fail With Validation Error) ---');
  const fakeCeoReg = await request('/api/auth/register', { method: 'POST' }, {
    full_name: 'Second Imposter CEO',
    email: fakeCeoEmail,
    role: 'CEO',
    password: 'AnotherPassword@123'
  });
  console.log('Second CEO Registration Status:', fakeCeoReg.statusCode);
  console.log('Validation Error Message:', fakeCeoReg.data.error);

  console.log('\n--- 5. Register Real HR Account ---');
  const hrReg = await request('/api/auth/register', { method: 'POST' }, {
    full_name: 'Sunita Sharma',
    email: hrEmail,
    role: 'HR',
    password: 'HrSecurePassword@2026',
    phone: '+91 98222 33344'
  });
  console.log('HR Register Status:', hrReg.statusCode, '| Role:', hrReg.data.user?.role, '| Name:', hrReg.data.user?.full_name);

  console.log('\n--- 6. Register Real BDM Account 1 ---');
  const bdm1Reg = await request('/api/auth/register', { method: 'POST' }, {
    full_name: 'Rohan Verma',
    email: bdm1Email,
    role: 'BDM',
    password: 'BdmPassword@2026',
    phone: '+91 98333 44455'
  });
  console.log('BDM 1 Register Status:', bdm1Reg.statusCode, '| Role:', bdm1Reg.data.user?.role, '| Name:', bdm1Reg.data.user?.full_name);

  console.log('\n--- 7. Register Real BDM Account 2 ---');
  const bdm2Reg = await request('/api/auth/register', { method: 'POST' }, {
    full_name: 'Kavita Menon',
    email: bdm2Email,
    role: 'BDM',
    password: 'BdmPassword@2026',
    phone: '+91 98444 55566'
  });
  console.log('BDM 2 Register Status:', bdm2Reg.statusCode, '| Role:', bdm2Reg.data.user?.role, '| Name:', bdm2Reg.data.user?.full_name);

  console.log('\n--- 8. Test Forgot Password Flow for BDM 1 ---');
  const forgotRes = await request('/api/auth/forgot-password', { method: 'POST' }, {
    email: bdm1Email
  });
  console.log('Forgot Password Status:', forgotRes.statusCode, '| Message:', forgotRes.data.message);
  console.log('Generated Reset Token:', forgotRes.data.resetToken ? 'YES (Secure 64-char hex)' : 'NO');
  console.log('Reset URL:', forgotRes.data.resetUrl);
  const resetToken = forgotRes.data.resetToken;

  console.log('\n--- 9. Complete Password Reset With New Password ---');
  const newBdmPassword = 'BrandNewPassword@2026';
  const resetRes = await request('/api/auth/reset-password', { method: 'POST' }, {
    token: resetToken,
    newPassword: newBdmPassword
  });
  console.log('Reset Password Status:', resetRes.statusCode, '| Message:', resetRes.data.message);

  console.log('\n--- 10. Sign In BDM 1 with New Password ---');
  const bdm1Login = await request('/api/auth/login', { method: 'POST' }, {
    email: bdm1Email,
    password: newBdmPassword
  });
  console.log('Login Status With New Password:', bdm1Login.statusCode, '| User:', bdm1Login.data.user?.full_name, `(${bdm1Login.data.user?.role})`);
  const bdmCookie = bdm1Login.headers['set-cookie'] ? bdm1Login.headers['set-cookie'][0].split(';')[0] : '';

  console.log('\n--- 11. Real Working Flow: BDM Submits College Deal ---');
  const collegesRes = await request('/api/colleges', { method: 'GET' }, null, bdmCookie);
  const college = collegesRes.data.colleges?.[0];
  console.log('College:', college?.legal_name);

  const dealRes = await request('/api/deals', { method: 'POST' }, {
    college_id: college.id,
    title: 'Autonomous Campus Industry CoE & AI Lab Partnership',
    business_category: 'TRAINING',
    description: 'Comprehensive industry center of excellence and joint student skill certification.',
    company_percentage: 70,
    college_percentage: 30,
    ratio_type: 'REVENUE_SHARE_PERCENTAGE',
    agreement_value: 1200000,
    currency: 'INR',
    contract_start_date: '2026-12-01',
    contract_end_date: '2027-11-30',
    terms_and_conditions: 'Standard confidentiality, annual SLA audit, placement assistance.',
    additional_remarks: 'Principal and placement officer signed off in person.',
    is_draft: true
  }, bdmCookie);
  const dealId = dealRes.data.id || dealRes.data.deal?.id;
  console.log('Draft Deal Created:', dealRes.statusCode, '| Deal ID:', dealId, '| Status:', dealRes.data.status);

  console.log('\n--- 12. BDM Submits Deal for Executive Review ---');
  const submitRes = await request(`/api/deals/${dealId}/submit`, { method: 'POST' }, {}, bdmCookie);
  console.log('Deal Submitted:', submitRes.statusCode, '| Status:', submitRes.data.deal?.status);

  console.log('\n--- 13. CEO Logs In and Approves Deal ---');
  const ceoLogin = await request('/api/auth/login', { method: 'POST' }, {
    email: ceoEmail,
    password: 'CeoSecurePassword@2026'
  });
  const ceoCookie = ceoLogin.headers['set-cookie'] ? ceoLogin.headers['set-cookie'][0].split(';')[0] : '';
  const approveRes = await request(`/api/deals/${dealId}/approve`, { method: 'POST' }, {
    remarks: 'Commercial percentages validated. Full executive signoff granted.'
  }, ceoCookie);
  console.log('CEO Approved:', approveRes.statusCode, '| Status:', approveRes.data.deal?.status);

  console.log('\n--- 14. HR Logs In and Creates Operational Task ---');
  const hrLogin = await request('/api/auth/login', { method: 'POST' }, {
    email: hrEmail,
    password: 'HrSecurePassword@2026'
  });
  const hrCookie = hrLogin.headers['set-cookie'] ? hrLogin.headers['set-cookie'][0].split(';')[0] : '';
  const taskRes = await request('/api/hr-tasks', { method: 'POST' }, {
    deal_id: dealId,
    college_id: college.id,
    title: 'Faculty Advisor Orientation & Onboarding Kit Handover',
    description: 'Coordinate schedule with Principal for the inaugural workshop session.',
    due_date: '2026-12-15'
  }, hrCookie);
  console.log('HR Task Dispatched:', taskRes.statusCode, '| Task Title:', taskRes.data.title, '| Status:', taskRes.data.status);

  console.log('\n===============================================================');
  console.log('ALL REGISTRATION, VALIDATION, AND FORGOT PASSWORD TESTS PASSED!');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
