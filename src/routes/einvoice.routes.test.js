
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import einvoiceRouter from './einvoice.routes.js';
import { db, initDatabase } from '../db/database.js';

const app = express();
app.use(express.json());
app.use('/api/einvoice', einvoiceRouter);

const JWT_SECRET = 'test-secret-key-do-not-use-in-production';
const merchantId = '1';

const token = jwt.sign(
  {
    id: merchantId,
    email: 'merchant@test.com',
    type: 'merchant'
  },
  JWT_SECRET
);

describe('E-invoice API regression tests', () => {
  before(() => {
    db.users = [];
    db.payments = [];
    db.sessions = [];
    db.table_orders = [];
    db.invoices = [];
    db.processed_webhooks = [];

    // Add the real merchant record expected by authenticate().
    initDatabase();
  });

  test('submits an invoice the first time', async () => {
    const response = await request(app)
      .post('/api/einvoice/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoice_id: 'INV-REGRESSION-001',
        customer_siret: '12345678901234'
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, 'submitted');
  });

  test('rejects a duplicate invoice submission', async () => {
    const response = await request(app)
      .post('/api/einvoice/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoice_id: 'INV-REGRESSION-001',
        customer_siret: '12345678901234'
      });

    assert.equal(response.status, 409);
    assert.equal(
      response.body.error,
      'Invoice already submitted to tax authority'
    );
  });
});
