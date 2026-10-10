import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { resetDatabase, db } from '../../db/database.js';
import { signWebhook } from './test-helpers.js';

beforeEach(() => resetDatabase());

function sendWebhook(payload, signature = signWebhook(payload)) {
  return request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);
}

test('Bug D: valid webhook signature updates the payment', async () => {
  const payload = { payment_id: '1', status: 'completed', event_id: 'event-valid' };
  const response = await sendWebhook(payload);

  assert.equal(response.status, 200);
  assert.equal(db.payments.find(payment => payment.id === '1').status, 'completed');
});

test('Bug D: invalid webhook signature is rejected before processing', async () => {
  const payload = { payment_id: '1', status: 'failed', event_id: 'event-invalid' };
  const response = await sendWebhook(payload, 'not-a-valid-signature');

  assert.equal(response.status, 401);
  assert.equal(db.payments.find(payment => payment.id === '1').status, 'completed');
});

test('Bug E: duplicate webhook event is processed only once', async () => {
  const firstPayload = { payment_id: '1', status: 'completed', event_id: 'event-duplicate' };
  const secondPayload = { payment_id: '1', status: 'failed', event_id: 'event-duplicate' };

  const first = await sendWebhook(firstPayload);
  const second = await sendWebhook(secondPayload);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.message, 'Already processed');
  assert.equal(db.payments.find(payment => payment.id === '1').status, 'completed');
  assert.deepEqual(db.processed_webhooks, ['event-duplicate']);
});

test('webhook rejects missing event id and unknown payment', async () => {
  const missingEvent = await sendWebhook({ payment_id: '1', status: 'completed', event_id: '' });
  const unknownPayment = await sendWebhook({ payment_id: 'missing', status: 'completed', event_id: 'event-missing-payment' });

  assert.equal(missingEvent.status, 400);
  assert.equal(unknownPayment.status, 404);
});
