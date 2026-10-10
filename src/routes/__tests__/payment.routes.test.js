import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';
import { v4 as uuidv4 } from 'uuid';

async function getToken() {
  const email = `merchant${uuidv4()}@test.com`;
  await request(app).post('/api/auth/register').send({
    email,
    password: 'TestPassword123!',
    business_name: 'Test Business'
  });
  const res = await request(app).post('/api/auth/login').send({
    email,
    password: 'TestPassword123!'
  });
  return res.body.token;
}

test('Bug A: GET /payments should return amount as number', async () => {
  const token = await getToken();
  
  // Create a payment
  await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 25.5,
      currency: 'EUR',
      customer_email: 'test@customer.com'
    });

  const res = await request(app)
    .get('/api/payments')
    .set('Authorization', `Bearer ${token}`);
  
  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.body.data[0].amount, 'number');
});

test('Bug B: POST /payments should reject amount over €50,000', async () => {
  const token = await getToken();
  
  const res = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 999999,
      currency: 'EUR',
      customer_email: 'test@customer.com'
    });
  
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error.includes('maximum limit'));
});
