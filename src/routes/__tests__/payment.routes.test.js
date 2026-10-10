
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { resetDatabase } from '../../db/database.js';

beforeEach(() => resetDatabase());

async function loginAndGetToken() {
  const response = await request(app).post('/api/auth/register').send({
    email: `payment-${Date.now()}-${Math.random()}@example.com`,
    password: 'SecurePass123!',
    business_name: 'Payment Test Merchant'
  });

  assert.equal(response.status, 201, response.text);
  return response.body.token;
}

async function createPayment(token, amount) {
  return request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount,
      currency: 'EUR',
      customer_email: 'test@example.com'
    });
}

test('Bug A: payment list returns amounts as numbers', async () => {
  const token = await loginAndGetToken();

  // Create a known payment so the list has an amount to check.
  const created = await createPayment(token, 25.5);
  assert.equal(created.status, 201);

  const response = await request(app)
    .get('/api/payments')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  const payment = response.body.data.find(p => p.amount === 25.5);

  assert.ok(payment, 'The created payment should appear in the list');
  assert.equal(typeof payment.amount, 'number');
});

test('Bug A: single payment returns amount as a number', async () => {
  const token = await loginAndGetToken();
  const created = await createPayment(token, 37.5);
  assert.equal(created.status, 201);

  const id = created.body.data.id;

  const response = await request(app)
    .get(`/api/payments/${id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.amount, 'number');
  assert.equal(response.body.data.amount, 37.5);
});

test('Bug B: reject amounts above EUR 50,000', async () => {
  const token = await loginAndGetToken();
  const response = await createPayment(token, 50000.01);

  assert.equal(response.status, 400);
  assert.match(response.body.error, /maximum|exceeds/i);
});

test('Bug B: accept an amount of exactly EUR 50,000', async () => {
  const token = await loginAndGetToken();
  const response = await createPayment(token, 50000);

  assert.equal(response.status, 201);
  assert.equal(response.body.data.amount, 50000);
});

test('Reject zero payment amount', async () => {
  const token = await loginAndGetToken();
  const response = await createPayment(token, 0);
  assert.equal(response.status, 400);
});

test('Reject negative payment amount', async () => {
  const token = await loginAndGetToken();
  const response = await createPayment(token, -1);
  assert.equal(response.status, 400);
});

test('Reject payment creation without authentication', async () => {
  const response = await request(app).post('/api/payments').send({
      amount: 25,
      currency: 'EUR',
      customer_email: 'test@example.com'
  });

  assert.equal(response.status, 401);
});
