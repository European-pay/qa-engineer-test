import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import app from '../../server.js';
import { createPayment, registerMerchant } from './test-helpers.js';

const secret = 'test-webhook-secret-key';
function signature(payload) {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

test('webhook rejects missing or invalid signatures', async () => {
  const payload = { payment_id: '1', status: 'completed', event_id: `evt-${Date.now()}` };
  const missing = await request(app).post('/api/webhooks/payment-status').send(payload);
  assert.equal(missing.status, 401);
  const invalid = await request(app).post('/api/webhooks/payment-status').set('x-webhook-signature', '0'.repeat(64)).send(payload);
  assert.equal(invalid.status, 401);
});

test('valid webhook updates a payment and duplicate delivery is idempotent', async () => {
  const { token } = await registerMerchant();
  const created = await createPayment(token);
  const payload = { payment_id: created.body.data.id, status: 'completed', event_id: `evt-${Date.now()}-${Math.random()}` };
  const first = await request(app).post('/api/webhooks/payment-status').set('x-webhook-signature', signature(payload)).send(payload);
  const second = await request(app).post('/api/webhooks/payment-status').set('x-webhook-signature', signature(payload)).send(payload);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.message, 'Already processed');
});

test('webhook requires event_id and reports unknown payments', async () => {
  const missingEvent = { payment_id: '1', status: 'completed' };
  const response = await request(app).post('/api/webhooks/payment-status').set('x-webhook-signature', signature(missingEvent)).send(missingEvent);
  assert.equal(response.status, 400);
  const unknown = { payment_id: 'does-not-exist', status: 'completed', event_id: `evt-${Date.now()}` };
  const notFound = await request(app).post('/api/webhooks/payment-status').set('x-webhook-signature', signature(unknown)).send(unknown);
  assert.equal(notFound.status, 404);
});
