
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import paymentRouter from './payment.routes.js';
import { db, initDatabase } from '../db/database.js';

const app = express();
app.use(express.json());

const token = jwt.sign(
  { id: '1', email: 'merchant@test.com', type: 'merchant' },
  'test-secret-key-do-not-use-in-production'
);

app.use('/api/payments', paymentRouter);

describe('Payment API regression tests', () => {
  before(() => {
    db.users = [];
    db.payments = [];
    db.sessions = [];
    db.table_orders = [];
    db.invoices = [];
    db.processed_webhooks = [];
    initDatabase();
  });

  test('accepts a valid payment', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 250,
        currency: 'EUR',
        customer_email: 'customer@example.com'
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.amount, 250);
  });

  test('rejects payment above €50,000', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 50001,
        currency: 'EUR',
        customer_email: 'customer@example.com'
      });

    assert.equal(response.status, 400);
  });

  test('rejects a zero payment', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 0,
        currency: 'EUR',
        customer_email: 'customer@example.com'
      });

    assert.equal(response.status, 400);
  });

  test('returns payment amounts as numbers', async () => {
    const created = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 125.5,
        currency: 'EUR',
        customer_email: 'customer@example.com'
      });

    assert.equal(created.status, 201);

    const response = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.ok(response.body.data.length > 0);

    for (const payment of response.body.data) {
      assert.equal(typeof payment.amount, 'number');
    }
  });
});
