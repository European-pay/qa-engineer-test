import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import request from 'supertest';
import app from '../../server.js';
import { db } from '../../db/database.js';

const WEBHOOK_SECRET = 'test-webhook-secret-key';

function createSignature(body) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
}

async function createTestPayment() {
  const email = 'webhook.test@example.com';

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Test12345!',
      business_name: 'Webhook Test Business'
    });

  let token = registerResponse.body.token;

  if (!token) {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'Test12345!'
      });

    token = loginResponse.body.token;
  }

  const paymentResponse = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 25.50,
      currency: 'EUR',
      customer_email: 'customer.webhook@example.com'
    });

  return paymentResponse.body.data.id;
}

test('rejects webhook with invalid signature', async () => {
  const paymentId = await createTestPayment();

  const body = {
    payment_id: paymentId,
    status: 'completed',
    event_id: 'evt-invalid-signature'
  };

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', 'fake-signature')
    .send(body);

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.error, 'Invalid signature');
});

test('processes webhook with valid signature', async () => {
  const paymentId = await createTestPayment();

  const body = {
    payment_id: paymentId,
    status: 'completed',
    event_id: 'evt-valid-signature'
  };

  const signature = createSignature(body);

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(body);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Webhook processed');
  assert.strictEqual(response.body.new_status, 'completed');
});

test('rejects webhook without signature', async () => {
  const paymentId = await createTestPayment();

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .send({
      payment_id: paymentId,
      status: 'completed',
      event_id: 'evt-no-signature'
    });

  assert.strictEqual(response.status, 401);
});

test('rejects webhook without event id', async () => {
  const paymentId = await createTestPayment();

  const body = {
    payment_id: paymentId,
    status: 'completed'
  };

  const signature = createSignature(body);

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(body);

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'event_id required');
});

test('does not process the same webhook event twice', async () => {
  const paymentId = await createTestPayment();

  const body = {
    payment_id: paymentId,
    status: 'completed',
    event_id: 'evt-duplicate-test'
  };

  const signature = createSignature(body);

  const firstResponse = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(body);

  assert.strictEqual(firstResponse.status, 200);
  assert.strictEqual(firstResponse.body.message, 'Webhook processed');

  const secondResponse = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(body);

  assert.strictEqual(secondResponse.status, 200);
  assert.strictEqual(secondResponse.body.message, 'Already processed');
  assert.strictEqual(
    db.processed_webhooks.filter(id => id === body.event_id).length,
    1
  );
});