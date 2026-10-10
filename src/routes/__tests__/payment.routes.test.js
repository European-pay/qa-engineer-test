import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app.js';
import { initDatabase } from '../../db/database.js';

initDatabase();

/**
 * Payment Routes Tests
 * 
 * Candidates should add tests here for Bug A (amount type)
 * 
 * Example test structure:
 * 
 * test('should return amount as number not string', async () => {
 *   const response = await getPayments();
 *   assert.strictEqual(typeof response.data[0].amount, 'number');
 * });
 */

// - GET /payments returns amount as number
test('GET/api/payments returns amount as a number',async () => {
  const token = jwt.sign(
    { id: '1', email: 'merchant@test.com',type: 'merchant'},
    'test-secret-key-do-not-use-in-production'
  );

  const response = await request(app)
  .get('/api/payments')
  .set('Authorization', `Bearer ${token}`);

  console.log(response.body)
  assert.equal(response.status, 200);
  for (const payment of response.body.data) {
    assert.equal(typeof payment.amount, 'number');
  }
});

// - GET /payments/:id returns amount as number
test('GET /api/payments/:id returns amount as a number', async () => {
  const token = jwt.sign(
    { id: '1', email: 'merchant@test.com', type: 'merchant' },
    'test-secret-key-do-not-use-in-production'
  );

  const response = await request(app)
    .get('/api/payments/1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.amount, 'number');
});

// - POST /payments with valid data
test('POST /api/payments accepts payment with valid amount', async () => {
  const token = jwt.sign(
    { id: '1', email: 'merchant@test.com', type: 'merchant' },
    'test-secret-key-do-not-use-in-production'
  );

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 4999,
      currency: 'EUR',
      customer_email: 'customer@test.com'
    });

  assert.equal(response.status, 201);
});

// - POST /payments with negative amount (should fail)
test('POST /api/payments rejects payment of negative amount', async () => {
  const token = jwt.sign(
    { id: '1', email: 'merchant@test.com', type: 'merchant' },
    'test-secret-key-do-not-use-in-production'
  );

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: -150,
      currency: 'EUR',
      customer_email: 'customer@test.com'
    });

  assert.equal(response.status, 400);
});
// - POST /payments with zero amount (should fail)
test('POST /api/payments rejects payment if amount is zero', async () => {
  const token = jwt.sign(
    { id: '1', email: 'merchant@test.com', type: 'merchant' },
    'test-secret-key-do-not-use-in-production'
  );

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 0,
      currency: 'EUR',
      customer_email: 'customer@test.com'
    });

  assert.equal(response.status, 400);
});

// - POST /payments with very large amount (> €50,000)
test('POST /api/payments rejects amount above maximum limit', async () => {
  const token = jwt.sign(
    { id: '1', email: 'merchant@test.com', type: 'merchant' },
    'test-secret-key-do-not-use-in-production'
  );

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 5000000,
      currency: 'EUR',
      customer_email: 'customer@test.com'
    });

  assert.equal(response.status, 400);
});

// - POST /payments without authentication
test('POST /api/payments rejects payment if user authentication fails', async () => {
  const token = jwt.sign(
    { id: '7', email: 'merchant@test.com', type: 'merchant' },
    'test-secret-key-do-not-use-in-production'
  );

  //invalid token: users.id = '7' doesn't exist in db
  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 200,
      currency: 'EUR',
      customer_email: 'customer@test.com'
    });

  assert.equal(response.status, 401);
});


// TODO: Add tests for:
// - GET /payments returns amount as number
// - GET /payments/:id returns amount as number
// - POST /payments with valid data
// - POST /payments with negative amount (should fail)
// - POST /payments with zero amount (should fail)
// - POST /payments with very large amount (> €50,000)
// - POST /payments without authentication