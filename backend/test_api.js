const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function api(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=== STARTING SECUREPAY BACKEND AUTOMATED TESTS ===\n');
  let passed = 0;
  let total = 0;

  function record(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName} - ${details}`);
    }
  }

  // 1. Health check
  const health = await api('/health');
  record('Health Check Online', health.status === 200 && health.data.status === 'online');

  // 2. User Registration
  const testUserEmail = `user_${Date.now()}@example.com`;
  const regRes = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'John Doe',
      email: testUserEmail,
      password: 'Password@123',
      initialBalance: 50000
    })
  });
  record('User Registration', regRes.status === 201 && regRes.data.success && regRes.data.token);
  const userToken = regRes.data.token;
  const userAccount = regRes.data.user.accountNumber;

  // 3. Duplicate Registration Prevention
  const dupRes = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate',
      email: testUserEmail,
      password: 'Password@123'
    })
  });
  record('Duplicate Registration Rejected', dupRes.status === 400 && !dupRes.data.success);

  // 4. Invalid Login (Wrong Password)
  const badLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUserEmail, password: 'WrongPassword' })
  });
  record('Invalid Login Rejected', badLogin.status === 401 && !badLogin.data.success);

  // 5. Valid Login
  const goodLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUserEmail, password: 'Password@123' })
  });
  record('Valid Login Success (JWT)', goodLogin.status === 200 && goodLogin.data.token);

  // 6. User Profile Retrieval
  const meRes = await api('/auth/me', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  record('User Profile /me Endpoint', meRes.status === 200 && meRes.data.user.email === testUserEmail);

  // 7. Self-Transfer Prevention
  const selfTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: testUserEmail, amount: 100 })
  });
  record('Transfer to Self Blocked', selfTx.status === 400 && !selfTx.data.success);

  // 8. Invalid Receiver Check
  const nonExistentTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'nobody@nowhere.com', amount: 100 })
  });
  record('Nonexistent Receiver Blocked', nonExistentTx.status === 404 && !nonExistentTx.data.success);

  // 9. Insufficient Balance Check
  const brokeTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 9999999 })
  });
  record('Insufficient Balance Blocked', brokeTx.status === 400 && !brokeTx.data.success);

  // 10. Normal Low Risk Transaction
  const lowTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 200 })
  });
  record(
    'Normal Transaction (LOW Risk & COMPLETED)',
    lowTx.status === 201 && lowTx.data.transaction.riskLevel === 'LOW' && lowTx.data.transaction.status === 'COMPLETED'
  );

  // 11. High Amount Transaction ($25,000)
  const highAmountTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 25000 })
  });
  record(
    'High Amount Transaction Risk Evaluation',
    highAmountTx.status === 201 && highAmountTx.data.transaction.breakdown.amountScore >= 40
  );

  // 12. High Frequency / Rapid Burst Transaction (< 5 seconds)
  const rapidTx1 = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 150 })
  });
  const rapidTx2 = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 150 })
  });
  record(
    'High Frequency / Rapid Burst Velocity Detection',
    rapidTx2.status === 201 && rapidTx2.data.transaction.breakdown.frequencyScore >= 35
  );

  // 13. Unusual Timing Transaction (3:00 AM)
  const nightTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 300, customHour: 3 })
  });
  record(
    'Unusual Night Timing Detection (3:00 AM)',
    nightTx.status === 201 && nightTx.data.transaction.breakdown.timingScore >= 50
  );

  // 14. Combined High Risk Transaction (High Amount + Night Hours -> Escalates to HIGH risk)
  const combinedHighTx = await api('/transactions/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 22000, customHour: 2 })
  });
  const highRiskTxId = combinedHighTx.data?.transaction?._id;
  record(
    'Combined HIGH Risk Escalation (Score >= 70 & Status UNDER_REVIEW)',
    combinedHighTx.status === 201 &&
      combinedHighTx.data.transaction.riskLevel === 'HIGH' &&
      combinedHighTx.data.transaction.status === 'UNDER_REVIEW'
  );

  // 15. User Transaction History
  const historyRes = await api('/transactions/my-transactions', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  record(
    'User Transaction History Retrieved',
    historyRes.status === 200 && historyRes.data.transactions.length >= 4
  );

  // 16. Admin Login
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@securepay.com', password: 'Admin@123' })
  });
  record('Admin Authentication Successful', adminLogin.status === 200 && adminLogin.data.user.role === 'admin');
  const adminToken = adminLogin.data.token;

  // 17. Unauthorized Admin Access Attempt by Normal User
  const unauthAdmin = await api('/admin/metrics', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  record('Unauthorized Admin Access Blocked (403)', unauthAdmin.status === 403);

  // 18. Admin Metrics
  const adminMetrics = await api('/admin/metrics', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record(
    'Admin Metrics API Operational',
    adminMetrics.status === 200 &&
      adminMetrics.data.metrics.totalTransactions > 0 &&
      adminMetrics.data.metrics.alerts.open > 0
  );

  // 19. Admin Fraud Alerts List
  const adminAlerts = await api('/admin/alerts', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record(
    'Admin Fraud Alerts Queue Operational',
    adminAlerts.status === 200 && adminAlerts.data.alerts.length > 0
  );

  // 20. Admin Investigation Details
  const adminInvest = await api(`/admin/transactions/${highRiskTxId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record(
    'Admin Investigation Console Details & Behavioral Profile',
    adminInvest.status === 200 &&
      adminInvest.data.transaction &&
      adminInvest.data.behavioralProfile &&
      adminInvest.data.alert
  );

  // 21. Admin Decision: Keep Under Review
  const reviewDec = await api(`/admin/transactions/${highRiskTxId}/decision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ decision: 'KEEP_UNDER_REVIEW', notes: 'Investigation pending phone call confirmation' })
  });
  record(
    'Admin Decision: KEEP_UNDER_REVIEW',
    reviewDec.status === 200 && reviewDec.data.transaction.status === 'UNDER_REVIEW'
  );

  // 22. Admin Decision: Approve Transaction
  const approveDec = await api(`/admin/transactions/${highRiskTxId}/decision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ decision: 'APPROVE', notes: 'Legitimate corporate transfer verified with client' })
  });
  record(
    'Admin Decision: APPROVE (Status changes to COMPLETED)',
    approveDec.status === 200 && approveDec.data.transaction.status === 'COMPLETED'
  );

  console.log(`\n=== AUTOMATED TEST SUMMARY: ${passed}/${total} PASSED ===`);
  if (passed === total) {
    console.log('ALL BACKEND & FRAUD DETECTION TESTS PASSED PERFECTLY!\n');
  } else {
    console.error(`FAILURES DETECTED: ${total - passed} test(s) failed.\n`);
  }
}

runTests().catch(console.error);
