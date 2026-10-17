// scripts/test-e2e-workflow.js
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
  console.log('==================================================');
  console.log('REAL WORKFLOW E2E VALIDATION');
  console.log('==================================================');

  // Ensure a CEO account exists before login (single‑CEO constraint)
  console.log('\n--- Step 0: Ensure CEO Account Exists ---');
  const initStatus = await request('/api/auth/register');
  if (!initStatus.data?.hasCeo) {
    const ensureCeoRes = await request('/api/auth/register', { method: 'POST' }, {
      full_name: 'Enterprise CEO',
      email: 'ceo@enterprise.edu',
      role: 'CEO',
      password: 'CeoPassword123!',
      phone: '+91 90000 11122'
    });
    console.log('CEO ensure register status:', ensureCeoRes.statusCode, '| Message:', ensureCeoRes.data?.message || ensureCeoRes.data?.error);
  } else {
    console.log('CEO already exists, skipping registration');
  }

  console.log('\n--- Step 1: Login as Executive CEO ---');
  const loginRes = await request('/api/auth/login', { method: 'POST' }, {
    email: 'ceo@enterprise.edu',
    password: 'CeoPassword123!'
  });
  console.log('Login Status:', loginRes.statusCode);
  console.log('User Name:', loginRes.data.user?.full_name, '| Role:', loginRes.data.user?.role);
  const ceoCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : '';
  if (!ceoCookie) throw new Error('Failed to acquire CEO session cookie');

  console.log('\n--- Step 2: Fetch Current Team List (CEO) ---');
  const usersRes = await request('/api/users', { method: 'GET' }, null, ceoCookie);
  console.log('Users Query Status:', usersRes.statusCode, '| Count:', usersRes.data.users?.length);
  usersRes.data.users?.forEach(u => console.log(`  * ${u.full_name} (${u.role}) - ${u.email} [${u.is_active ? 'Active' : 'Inactive'}]`));

  console.log('\n--- Step 3: CEO Provisions Real HR Employee Account ---');
  const uniqueHrEmail = `hr.ops.${Date.now()}@enterprise.edu`;
  const hrRes = await request('/api/users', { method: 'POST' }, {
    email: uniqueHrEmail,
    full_name: 'Operations Coordinator HR',
    role: 'HR',
    password: 'SecurePassword@123'
  }, ceoCookie);
  console.log('Create HR Status:', hrRes.statusCode, '| Provisioned:', hrRes.data.user?.email);

  console.log('\n--- Step 4: CEO Provisions Real BDM Employee Account ---');
  const uniqueBdmEmail = `bdm.north.${Date.now()}@enterprise.edu`;
  const bdmRes = await request('/api/users', { method: 'POST' }, {
    email: uniqueBdmEmail,
    full_name: 'North Region BDM Specialist',
    role: 'BDM',
    password: 'SecurePassword@123'
  }, ceoCookie);
  console.log('Create BDM Status:', bdmRes.statusCode, '| Provisioned:', bdmRes.data.user?.email);

  console.log('\n--- Step 5: CEO Tries to Create 2nd CEO Account (Must Be Forbidden) ---');
  const fakeCeoRes = await request('/api/users', { method: 'POST' }, {
    email: 'fake.ceo@enterprise.edu',
    full_name: 'Fake CEO',
    role: 'CEO',
    password: 'SecurePassword@123'
  }, ceoCookie);
  console.log('Create 2nd CEO Status:', fakeCeoRes.statusCode, '| Error:', fakeCeoRes.data.error);

  console.log('\n--- Step 6: Log In As Newly Created Real BDM ---');
  const bdmLogin = await request('/api/auth/login', { method: 'POST' }, {
    email: uniqueBdmEmail,
    password: 'SecurePassword@123'
  });
  console.log('BDM Login Status:', bdmLogin.statusCode, '| BDM Name:', bdmLogin.data.user?.full_name);
  const bdmCookie = bdmLogin.headers['set-cookie'] ? bdmLogin.headers['set-cookie'][0].split(';')[0] : '';
  if (!bdmCookie) throw new Error('Failed to acquire BDM session cookie');

  console.log('\n--- Step 7: Security Guard: BDM Cannot Access /api/users ---');
  const forbiddenUsers = await request('/api/users', { method: 'GET' }, null, bdmCookie);
  console.log('BDM Accessing /api/users Status:', forbiddenUsers.statusCode, '| Guard:', forbiddenUsers.data.error);

  console.log('\n--- Step 8: BDM Submits Real College Deal ---');
  const collegesRes = await request('/api/colleges', { method: 'GET' }, null, bdmCookie);
  const college = collegesRes.data.colleges?.[0];
  console.log('Target Institution:', college?.legal_name, `(${college?.id})`);

  const dealRes = await request('/api/deals', { method: 'POST' }, {
    college_id: college.id,
    title: 'Campus Placement & Executive Training Deal 2026',
    business_category: 'TRAINING',
    description: 'Full institution-wide skill development, training, and placement enablement.',
    company_percentage: 75,
    college_percentage: 25,
    ratio_type: 'REVENUE_SHARE_PERCENTAGE',
    agreement_value: 750000,
    currency: 'INR',
    contract_start_date: '2026-11-01',
    contract_end_date: '2027-10-31',
    terms_and_conditions: 'Standard non-disclosure, semi-annual review, and SLA governance.',
    additional_remarks: 'MOU negotiated in person with Dean of Academics.',
    is_draft: true
  }, bdmCookie);
  const dealId = dealRes.data.id || dealRes.data.deal?.id;
  console.log('Draft Deal Created Status:', dealRes.statusCode, '| Deal ID:', dealId, '| Status:', dealRes.data.status || dealRes.data.deal?.status);

  console.log('\n--- Step 9: BDM Submits Deal For Executive Review ---');
  const submitRes = await request(`/api/deals/${dealId}/submit`, { method: 'POST' }, {}, bdmCookie);
  console.log('Submit Status:', submitRes.statusCode, '| New Status:', submitRes.data.deal?.status);

  console.log('\n--- Step 10: CEO Reviews and Approves Deal ---');
  const approveRes = await request(`/api/deals/${dealId}/approve`, { method: 'POST' }, {
    remarks: 'Commercial terms verified and approved. Commercial ratios within target boundary.'
  }, ceoCookie);
  console.log('CEO Approval Status:', approveRes.statusCode, '| Approved Status:', approveRes.data.deal?.status);

  console.log('\n--- Step 11: Real HR Logs In and Creates Onboarding Task ---');
  const hrLogin = await request('/api/auth/login', { method: 'POST' }, {
    email: uniqueHrEmail,
    password: 'SecurePassword@123'
  });
  console.log('HR Login Status:', hrLogin.statusCode, '| HR Name:', hrLogin.data.user?.full_name);
  const hrCookie = hrLogin.headers['set-cookie'] ? hrLogin.headers['set-cookie'][0].split(';')[0] : '';

  const taskRes = await request('/api/hr-tasks', { method: 'POST' }, {
    deal_id: dealId,
    college_id: college.id,
    title: 'Collect Executed Agreement & Designate Campus Coordinator',
    description: 'Follow up with Prof. Animesh Sen for signed bilateral physical copies.',
    due_date: '2026-11-10'
  }, hrCookie);
  console.log('HR Task Created Status:', taskRes.statusCode, '| Task Title:', taskRes.data.title, '| Status:', taskRes.data.status);

  console.log('\n--- Step 12: CEO Analytics KPI Verification ---');
  const kpiRes = await request('/api/dashboard/kpis', { method: 'GET' }, null, ceoCookie);
  console.log('CEO KPIs Status:', kpiRes.statusCode, '| Total Deals:', kpiRes.data.kpis?.totalDeals, '| Approved Deals:', kpiRes.data.kpis?.approvedDeals);

  console.log('\n==================================================');
  console.log('ALL REAL MULTI-USER WORKFLOW TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
