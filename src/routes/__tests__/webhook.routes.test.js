import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import app from '../../server.js';

const secret = process.env.WEBHOOK_SECRET || 'test-webhook-secret-key';
function signature(rawBody) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

function signed(body, raw = JSON.stringify(body)) {
  return request(app).post('/api/webhooks/payment-status')
    .set('Content-Type', 'application/json')
    .set('x-webhook-signature', signature(Buffer.from(raw)))
    .send(raw);
}

test('payment webhook rejects missing or incorrect signatures', async () => {
  const body = { payment_id: '1', status: 'failed', event_id: 'sig-test' };
  const rawBody = JSON.stringify(body);
  assert.equal((await request(app).post('/api/webhooks/payment-status').send(body)).status, 401);
  assert.equal((await request(app).post('/api/webhooks/payment-status')
    .set('Content-Type', 'application/json')
    .set('x-webhook-signature', 'f'.repeat(64))
    .send(rawBody)).status, 401);
});

test('valid payment webhook updates status and duplicate event is idempotent', async () => {
  const eventId = `evt-${Date.now()}`;
  const firstBody = { payment_id: '1', status: 'completed', event_id: ` ${eventId} ` };
  const retryBody = { payment_id: '1', status: 'failed', event_id: eventId };
  assert.equal((await signed(firstBody)).status, 200);
  const duplicate = await signed(retryBody);
  assert.equal(duplicate.status, 200);
  assert.match(duplicate.body.message, /Already processed/);
  const tokenResponse = await request(app).post('/api/auth/login').send({ email: 'merchant@test.com', password: 'Test123!' });
  const payment = await request(app).get('/api/payments/1').set({ Authorization: `Bearer ${tokenResponse.body.token}` });
  assert.equal(payment.body.data.status, 'completed');
});

test('webhook signature is verified against the exact raw request bytes', async () => {
  const rawBody = `{ "payment_id":"1", "status":"completed", "event_id":"raw-${Date.now()}" }`;
  const body = JSON.parse(rawBody);
  const response = await signed(body, rawBody);
  assert.equal(response.status, 200);
});

test('webhook without a JSON body is rejected instead of causing a server error', async () => {
  const response = await request(app).post('/api/webhooks/payment-status');
  assert.equal(response.status, 401);
});

test('webhook validates required data, status, and payment existence', async () => {
  for (const body of [
    { payment_id: '1', status: 'pending' },
    { payment_id: '1', status: '<script>', event_id: 'bad-status' },
    { payment_id: 'missing', status: 'failed', event_id: 'missing-payment' }
  ]) {
    const response = await signed(body);
    assert.ok([400, 404].includes(response.status));
  }
});
