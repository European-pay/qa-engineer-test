
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import authRouter from './auth.routes.js';
import { db } from '../db/database.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication API regression tests', () => {
  before(() => {
    db.users = [];
    db.payments = [];
    db.sessions = [];
    db.table_orders = [];
    db.invoices = [];
    db.processed_webhooks = [];
  });

  test('accepts a valid email during registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'valid.qa@example.com',
        password: 'QaTest123!',
        business_name: 'QA Test Business'
      });

    assert.equal(response.status, 201);
  });

  test('rejects an email without a fully qualified domain', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'qa-user@domain',
        password: 'QaTest123!',
        business_name: 'QA Test Business'
      });

    assert.equal(response.status, 400);
  });

  test('rejects duplicate registration emails', async () => {
    const email = 'duplicate.qa@example.com';
    const user = {
      email,
      password: 'QaTest123!',
      business_name: 'QA Test Business'
    };

    const first = await request(app)
      .post('/api/auth/register')
      .send(user);

    const second = await request(app)
      .post('/api/auth/register')
      .send(user);

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
  });
});
