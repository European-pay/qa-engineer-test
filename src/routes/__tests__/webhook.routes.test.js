import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';
import crypto from 'crypto';
import { db } from '../../db/database.js';

const WEBHOOK_SECRET = 'test-webhook-secret-key';

test('Bug D: Webhook - should reject invalid signature', async () => {
  const payload = {
    payment_id: "1",
    status: "completed",
    event_id: "evt_test1"
  };

  const res = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', 'invalid-signature')
    .send(payload);
  
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Invalid signature');
});

test('Bug E: Webhook - should enforce idempotency', async () => {
  const payload = {
    payment_id: "1",
    status: "completed",
    event_id: "evt_idempotency_test"
  };

  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  // First request should succeed
  const res1 = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);
  
  assert.strictEqual(res1.status, 200);

  // Second request with same event_id should return idempotency message
  const res2 = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);
  
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.message, 'Already processed');
});
