import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { createPayment, registerMerchant } from './test-helpers.js';

test('GET /payments returns amounts as numbers', async () => {
  const { token } = await registerMerchant();
  await createPayment(token);
  const response = await request(app).get('/api/payments').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data[0].amount, 'number');
});

test('GET /payments/:id returns amount as a number', async () => {
  const { token } = await registerMerchant();
  const created = await createPayment(token, { amount: '12.75' });
  const response = await request(app).get(`/api/payments/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.amount, 12.75);
  assert.equal(typeof response.body.data.amount, 'number');
});

test('POST /payments rejects amounts above 50,000 EUR', async () => {
  const { token } = await registerMerchant();
  const response = await createPayment(token, { amount: 50000.01 });
  assert.equal(response.status, 400);
});

test('POST /payments rejects non-finite amounts and unauthenticated requests', async () => {
  const unauthenticated = await request(app).post('/api/payments').send({ amount: 10, currency: 'EUR', customer_email: 'a@example.com' });
  assert.equal(unauthenticated.status, 401);
  const { token } = await registerMerchant();
  const invalid = await createPayment(token, { amount: 'not-a-number' });
  assert.equal(invalid.status, 400);
});
