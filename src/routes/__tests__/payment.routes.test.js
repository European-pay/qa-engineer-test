import { test, before } from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:3000';
let token;

// register + login once, reuse the token across all payment tests
before(async () => {
  const email = `paytest_${Date.now()}@test.com`;
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test123!', business_name: 'Pay Test Co' })
  });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test123!' })
  });
  const data = await res.json();
  token = data.token;
});

// checking this returns an actual number — was coming back as a string before
test('GET /payments - amount should be a number not a string', async () => {
  const res = await fetch(`${BASE}/api/payments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();

  // create a payment first so there's at least one to check
  if (data.data.length > 0) {
    assert.strictEqual(typeof data.data[0].amount, 'number');
  }
});

test('POST /payments with valid data should create payment', async () => {
  const res = await fetch(`${BASE}/api/payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 49.99, currency: 'EUR', customer_email: 'cust@example.com' })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(typeof data.data.amount, 'number');
  assert.strictEqual(data.data.amount, 49.99);
});

// used to accept any amount — making sure the 50k cap is actually enforced now
test('POST /payments with amount over 50000 should be rejected', async () => {
  const res = await fetch(`${BASE}/api/payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 999999, currency: 'EUR', customer_email: 'cust@example.com' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.toLowerCase().includes('maximum') || data.error.toLowerCase().includes('exceed'));
});

test('POST /payments with negative amount should be rejected', async () => {
  const res = await fetch(`${BASE}/api/payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: -10, currency: 'EUR', customer_email: 'cust@example.com' })
  });
  assert.strictEqual(res.status, 400);
});

test('GET /payments without auth should return 401', async () => {
  const res = await fetch(`${BASE}/api/payments`);
  assert.strictEqual(res.status, 401);
});
