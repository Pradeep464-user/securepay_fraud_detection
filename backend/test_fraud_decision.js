const BASE_URL = 'http://127.0.0.1:5000/api';

async function testFraudRefund() {
  console.log('Testing Admin FLAG_FRAUD refund workflow...');

  // 1. Create a test user with $10,000 balance
  const email = `victim_${Date.now()}@example.com`;
  const reg = await (await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Victim User', email, password: 'Password@123', initialBalance: 10000 })
  })).json();

  const userToken = reg.token;
  console.log(`User created with balance: $${reg.user.balance}`);

  // 2. Send high risk transaction of $8,000 during simulated night hour (02:00)
  const txRes = await (await fetch(`${BASE_URL}/transactions/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({ receiverIdentifier: 'alex.smith@example.com', amount: 8000, customHour: 2 })
  })).json();

  console.log(`Transaction created: ID ${txRes.transaction.transactionId}, Status: ${txRes.transaction.status}, Risk: ${txRes.transaction.riskLevel}`);
  console.log(`Balance after sending (funds held): $${txRes.newBalance}`);

  // 3. Admin login
  const adminLogin = await (await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@securepay.com', password: 'Admin@123' })
  })).json();
  const adminToken = adminLogin.token;

  // 4. Admin investigates and makes decision: FLAG_FRAUD
  const decisionRes = await (await fetch(`${BASE_URL}/admin/transactions/${txRes.transaction._id}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ decision: 'FLAG_FRAUD', notes: 'Confirmed unauthorized takeover pattern' })
  })).json();

  console.log(`Admin decision result: Status = ${decisionRes.transaction.status}, Decision = ${decisionRes.transaction.adminDecision.decision}`);

  // 5. Verify User balance is refunded back to $10,000
  const me = await (await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` }
  })).json();

  console.log(`User balance after fraud resolution refund: $${me.user.balance}`);
  if (me.user.balance === 10000 && decisionRes.transaction.status === 'FRAUD') {
    console.log('SUCCESS: Complete Fraud Decision & Full Balance Refund Verified!');
  } else {
    throw new Error('Balance refund failed!');
  }
}

testFraudRefund().catch(console.error);
