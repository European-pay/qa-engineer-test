
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import crypto from 'node:crypto';
import webhookRouter from './webhook.routes.js';
import { db, initDatabase } from '../db/database.js';

const app = express();
app.use(express.json());
app.use('/api/webhooks', webhookRouter);

const SECRET = 'test-webhook-secret-key';

function sign(body) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
}

describe('Webhook API regression tests', () => {
  before(() => {
    db.users = [];
    db.payments = [];
    db.sessions = [];
    db.table_orders = [];
    db.invoices = [];
    db.processed_webhooks = [];
    initDatabase();
  });

  test('rejects a missing webhook signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/payment-status')
      .send({
        payment_id: '1',
        status: 'pending',
        event_id: 'missing-signature-test'
      });

    assert.equal(response.status, 401);
  });

  test('rejects an invalid webhook signature', async () => {
    const body = {
      payment_id: '1',
      status: 'pending',
      event_id: 'invalid-signature-test'
    };

    const response = await request(app)
      .post('/api/webhooks/payment-status')
      .set('x-webhook-signature', 'fake-signature')
      .send(body);

    assert.equal(response.status, 401);
  });

  test('processes a valid webhook only once', async () => {
    const body = {
      payment_id: '1',
      status: 'pending',
      event_id: 'idempotency-test-001'
    };

    const signature = sign(body);

    const first = await request(app)
      .post('/api/webhooks/payment-status')
      .set('x-webhook-signature', signature)
      .send(body);

    const second = await request(app)
      .post('/api/webhooks/payment-status')
      .set('x-webhook-signature', signature)
      .send(body);

    assert.equal(first.status, 200);
    assert.equal(first.body.message, 'Webhook processed');
    assert.equal(second.status, 200);
    assert.equal(second.body.message, 'Already processed');
  });
});
