import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

describe('Payment Routes Tests', () => {
  let authToken;
  let testPaymentId;

  before(async () => {
    // Register and login a test merchant to acquire a valid Bearer token
    const email = `pay_candidate_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      email,
      password: 'securepassword123',
      business_name: 'Payment Test Store'
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password: 'securepassword123'
    });

    authToken = loginRes.body.token;

    // Create a seed payment for GET tests
    const createRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 250.75,
        currency: 'EUR',
        customer_email: 'customer@example.com'
      });

    testPaymentId = createRes.body.data?.id;
  });

  test('GET /payments returns amount as number (Bug A)', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length > 0, 'Should have at least one payment');
    assert.strictEqual(
      typeof res.body.data[0].amount,
      'number',
      'Payment amount must be a number, not a string'
    );
  });

  test('GET /payments/:id returns amount as number', async () => {
    assert.ok(testPaymentId, 'A valid testPaymentId must exist');
    
    const res = await request(app)
      .get(`/api/payments/${testPaymentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(
      typeof res.body.data.amount,
      'number',
      'Single payment amount must be a number'
    );
  });

  test('POST /payments with valid data creates payment successfully', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 100.00,
        currency: 'USD',
        customer_email: 'buyer@example.com'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.amount, 100);
  });

  test('POST /payments with negative amount should fail', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: -50.00,
        currency: 'EUR',
        customer_email: 'fail@example.com'
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error, 'Should return validation error');
  });

  test('POST /payments with zero amount should fail', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 0,
        currency: 'EUR',
        customer_email: 'zero@example.com'
      });

    assert.strictEqual(res.status, 400);
  });

  test('POST /payments with very large amount (> €50,000) should fail', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 999999999,
        currency: 'EUR',
        customer_email: 'whale@example.com'
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error, 'Should reject amounts exceeding maximum limit');
  });

  test('POST /payments without authentication should fail', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        amount: 50.00,
        currency: 'EUR',
        customer_email: 'unauth@example.com'
      });

    assert.strictEqual(res.status, 401);
  });
});