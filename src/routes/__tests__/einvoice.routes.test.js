import { test, before } from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:3000';
let token;
// use a unique invoice_id per test run so server restarts don't affect things
const invoiceId = `inv_test_${Date.now()}`;

before(async () => {
  const email = `einvoice_${Date.now()}@test.com`;
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test123!', business_name: 'Invoice Test Co' })
  });
  const data = await reg.json();
  token = data.token;
});

test('submitting a new invoice should return 200', async () => {
  const res = await fetch(`${BASE}/api/einvoice/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId, customer_siret: '12345678901234' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.data.submission_id);
  assert.strictEqual(data.data.status, 'submitted');
});

// re-submitting the same invoice was allowed before \u2014 should now come back 409
test('submitting the same invoice twice should return 409', async () => {
  const res = await fetch(`${BASE}/api/einvoice/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId, customer_siret: '12345678901234' })
  });
  assert.strictEqual(res.status, 409);
  const data = await res.json();
  assert.ok(data.error.toLowerCase().includes('already submitted'));
});

test('checking status of submitted invoice should show submitted', async () => {
  const res = await fetch(`${BASE}/api/einvoice/status/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.data.einvoice_status, 'submitted');
  assert.ok(data.data.submission_id);
});

test('submit invoice without a valid SIRET should return 400', async () => {
  const res = await fetch(`${BASE}/api/einvoice/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: `inv_nosiret_${Date.now()}`, customer_siret: '123' })
  });
  assert.strictEqual(res.status, 400);
});
