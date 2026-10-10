import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';

async function token() {
  const response = await request(app).post('/api/auth/login').send({ email: 'merchant@test.com', password: 'Test123!' });
  assert.equal(response.status, 200);
  return response.body.token;
}

test('payment list and detail return numeric amounts', async () => {
  const jwt = await token();
  const headers = { Authorization: `Bearer ${jwt}` };
  const list = await request(app).get('/api/payments').set(headers);
  assert.equal(list.status, 200);
  assert.equal(typeof list.body.data[0].amount, 'number');
  const detail = await request(app).get('/api/payments/1').set(headers);
  assert.equal(typeof detail.body.data.amount, 'number');
});

test('payment creation validates amount bounds and customer email', async () => {
  const jwt = await token();
  const headers = { Authorization: `Bearer ${jwt}` };
  const valid = await request(app).post('/api/payments').set(headers).send({ amount: 50000, currency: 'EUR', customer_email: 'buyer@example.com' });
  assert.equal(valid.status, 201);
  for (const amount of [0, -1, 50000.01, 'not-a-number', '', '   ', true, false, null]) {
    const response = await request(app).post('/api/payments').set(headers).send({ amount, currency: 'EUR', customer_email: 'buyer@example.com' });
    assert.equal(response.status, 400, `amount ${JSON.stringify(amount)} should be rejected`);
  }
  for (const customer_email of ['user@domain', 'not-an-email', 42]) {
    const response = await request(app).post('/api/payments').set(headers).send({ amount: 12, currency: 'EUR', customer_email });
    assert.equal(response.status, 400, `email ${JSON.stringify(customer_email)} should be rejected`);
  }
});

test('payment endpoints require authentication', async () => {
  assert.equal((await request(app).get('/api/payments')).status, 401);
});
