import { test } from 'node:test';
import assert from 'node:assert';
import '../../server.js';

const BASE_URL = 'http://localhost:3000';

async function loginAndGetToken() {
  const uniqueEmail = `merchant_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'SecurePass123!',
      business_name: 'Test Business'
    })
  });
  const data = await response.json();
  return data.token;
}

test('Bug A: GET /payments should return amount as number', async () => {
  // Arrange
  const token = await loginAndGetToken();

  // Create a payment first so we have data
  await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 25.5,
      currency: 'EUR',
      customer_email: 'test@test.com'
    })
  });

  // Act
  const response = await fetch(`${BASE_URL}/api/payments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(typeof data.data[0].amount, 'number');
  assert.strictEqual(data.data[0].amount, 25.5);
});

test('Bug A: GET /payments/:id should return amount as number', async () => {
  const token = await loginAndGetToken();

  const createRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 75.25,
      currency: 'EUR',
      customer_email: 'single@test.com'
    })
  });
  const created = await createRes.json();
  const paymentId = created.data.id;

  const response = await fetch(`${BASE_URL}/api/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(typeof data.data.amount, 'number');
  assert.strictEqual(data.data.amount, 75.25);
});

test('Bug B: POST /payments should reject amount over €50,000', async () => {
  const token = await loginAndGetToken();

  const response = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 999999,
      currency: 'EUR',
      customer_email: 'test@test.com'
    })
  });

  assert.strictEqual(response.status, 400);
  const data = await response.json();
  assert.ok(data.error.includes('maximum'));
});

test('Negative Case: POST /payments should reject negative amount', async () => {
  const token = await loginAndGetToken();

  const response = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: -50,
      currency: 'EUR',
      customer_email: 'test@test.com'
    })
  });

  assert.strictEqual(response.status, 400);
});