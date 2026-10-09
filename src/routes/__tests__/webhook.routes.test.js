import { test, before } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

const BASE = 'http://localhost:3000';
const WEBHOOK_SECRET = 'test-webhook-secret-key';

// helper to compute the expected HMAC signature for a given body
// needs to match exactly what the server computes on req.body
function sign(body) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
}

// create a payment we can use in webhook tests
let paymentId;
before(async () => {
  const email = `webhooktest_${Date.now()}@test.com`;
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test123!', business_name: 'Webhook Co' })
  });
  const regData = await reg.json();
  const token = regData.token;

  const pay = await fetch(`${BASE}/api/payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100, currency: 'EUR', customer_email: 'c@test.com' })
  });
  const payData = await pay.json();
  paymentId = payData.data.id;
});

// no signature check was happening before — this should now bounce with 401
test('webhook with fake signature should be rejected with 401', async () => {
  const body = { payment_id: '1', status: 'completed', event_id: `evt_fake_${Date.now()}` };
  const res = await fetch(`${BASE}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': 'thisisnotvalid' },
    body: JSON.stringify(body)
  });
  assert.strictEqual(res.status, 401);
});

test('webhook with valid signature should be processed', async () => {
  const body = { payment_id: paymentId, status: 'completed', event_id: `evt_valid_${Date.now()}` };
  const res = await fetch(`${BASE}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': sign(body) },
    body: JSON.stringify(body)
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.new_status, 'completed');
});

// same event_id twice — second one should be a no-op, not processed again
test('sending the same webhook event_id twice should only process once', async () => {
  const eventId = `evt_idempotent_${Date.now()}`;
  const body = { payment_id: paymentId, status: 'pending', event_id: eventId };
  const sig = sign(body);

  const headers = { 'Content-Type': 'application/json', 'x-webhook-signature': sig };

  const first = await fetch(`${BASE}/api/webhooks/payment-status`, {
    method: 'POST', headers, body: JSON.stringify(body)
  });
  assert.strictEqual(first.status, 200);

  const second = await fetch(`${BASE}/api/webhooks/payment-status`, {
    method: 'POST', headers, body: JSON.stringify(body)
  });
  assert.strictEqual(second.status, 200);
  const secondData = await second.json();
  assert.ok(secondData.message === 'Already processed');
});

test('webhook missing payment_id should return 400', async () => {
  const body = { status: 'completed', event_id: `evt_noid_${Date.now()}` };
  const res = await fetch(`${BASE}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': sign(body) },
    body: JSON.stringify(body)
  });
  assert.strictEqual(res.status, 400);
});
