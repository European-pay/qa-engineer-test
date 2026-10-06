import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import '../../server.js';

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_SECRET = 'test-webhook-secret-key';

function computeSignature(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

test('Bug D: Webhook with invalid signature should reject with 401', async () => {
  const payload = {
    payment_id: '1',
    status: 'completed',
    event_id: 'evt_bad_sig'
  };

  const response = await fetch(`${BASE_URL}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': 'invalid-signature-value'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  assert.strictEqual(response.status, 401);
  assert.strictEqual(data.error, 'Invalid signature');
});

test('Bug D: Webhook with valid signature should process successfully', async () => {
  const payload = {
    payment_id: '1',
    status: 'completed',
    event_id: `evt_valid_${Date.now()}`
  };
  const signature = computeSignature(payload);

  const response = await fetch(`${BASE_URL}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.message, 'Webhook processed');
  assert.strictEqual(data.new_status, 'completed');
});

test('Bug E: Duplicate webhook (same event_id) should return Already processed', async () => {
  const payload = {
    payment_id: '1',
    status: 'completed',
    event_id: `evt_dup_${Date.now()}`
  };
  const signature = computeSignature(payload);

  // First delivery
  const res1 = await fetch(`${BASE_URL}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body: JSON.stringify(payload)
  });
  assert.strictEqual(res1.status, 200);

  // Second duplicate delivery
  const res2 = await fetch(`${BASE_URL}/api/webhooks/payment-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body: JSON.stringify(payload)
  });

  const data2 = await res2.json();
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(data2.message, 'Already processed');
});