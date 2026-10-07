import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

let authToken;
let paymentId;

async function getAuthToken() {
  const email = 'payment.test@example.com';
  const password = 'Test12345!';

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      business_name: 'Payment Test Business'
    });

  if (registerResponse.status === 201) {
    return registerResponse.body.token;
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return loginResponse.body.token;
}

test('GET /payments returns amount as a number', async () => {
  authToken = await getAuthToken();

  await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: 25.50,
      currency: 'EUR',
      customer_email: 'list.payment@example.com'
    });
    
  const response = await request(app)
    .get('/api/payments')
    .set('Authorization', `Bearer ${authToken}`);

  assert.strictEqual(response.status, 200);
  assert.ok(response.body.data.length > 0);
  assert.strictEqual(typeof response.body.data[0].amount, 'number');
});

test('POST /payments creates a payment with valid data', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: 25.50,
      currency: 'EUR',
      customer_email: 'customer.payment@example.com'
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.data.amount, 25.50);

  paymentId = response.body.data.id;
});

test('GET /payments/:id returns amount as a number', async () => {
  const response = await request(app)
    .get(`/api/payments/${paymentId}`)
    .set('Authorization', `Bearer ${authToken}`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(typeof response.body.data.amount, 'number');
});

test('POST /payments rejects negative amount', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: -10,
      currency: 'EUR',
      customer_email: 'negative@example.com'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Valid amount is required');
});

test('POST /payments rejects zero amount', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: 0,
      currency: 'EUR',
      customer_email: 'zero@example.com'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Valid amount is required');
});

test('POST /payments rejects amount above 50000 EUR', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: 50001,
      currency: 'EUR',
      customer_email: 'large-payment@example.com'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    response.body.error,
    'Payment amount cannot exceed €50,000'
  );
});

test('POST /payments rejects invalid currency', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: 100,
      currency: 'INR',
      customer_email: 'currency@example.com'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    response.body.error,
    'Valid currency is required (EUR, USD, GBP)'
  );
});

test('POST /payments rejects invalid customer email', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      amount: 100,
      currency: 'EUR',
      customer_email: 'invalid-email'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    response.body.error,
    'Valid customer email is required'
  );
});

test('POST /payments rejects unauthenticated request', async () => {
  const response = await request(app)
    .post('/api/payments')
    .send({
      amount: 100,
      currency: 'EUR',
      customer_email: 'unauthenticated@example.com'
    });

  assert.strictEqual(response.status, 401);
});

test('GET /payments rejects unauthenticated request', async () => {
  const response = await request(app)
    .get('/api/payments');

  assert.strictEqual(response.status, 401);
});