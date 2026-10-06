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

test('Happy Path: POST /api/einvoice/submit should submit invoice with valid SIRET', async () => {
  const token = await loginAndGetToken();
  const invoiceId = `inv_valid_${Date.now()}`;

  const response = await fetch(`${BASE_URL}/api/einvoice/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      invoice_id: invoiceId,
      customer_siret: '12345678901234'
    })
  });

  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.status, 'submitted');
});

test('Bug G: Duplicate e-invoice submission should reject with 409 Conflict', async () => {
  const token = await loginAndGetToken();
  const invoiceId = `inv_dup_${Date.now()}`;
  const payload = {
    invoice_id: invoiceId,
    customer_siret: '12345678901234'
  };

  // First submission
  const res1 = await fetch(`${BASE_URL}/api/einvoice/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  assert.strictEqual(res1.status, 200);

  // Duplicate submission
  const res2 = await fetch(`${BASE_URL}/api/einvoice/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data2 = await res2.json();
  assert.strictEqual(res2.status, 409);
  assert.strictEqual(data2.error, 'Invoice already submitted to tax authority');
});