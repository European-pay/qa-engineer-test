
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import tableOrderRouter from './table-order.routes.js';
import { db } from '../db/database.js';

const app = express();
app.use(express.json());
app.use('/api/table-orders', tableOrderRouter);

describe('Table Order API regression tests', () => {
  before(() => {
    db.table_orders = [];
  });

  test('creates the first pending order for a table', async () => {
    const response = await request(app)
      .post('/api/table-orders')
      .send({
        merchant_id: 'merchant-test-f',
        table_number: 'T20',
        items: [{ name: 'Burger', price: 10, quantity: 2 }]
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.status, 'pending');
  });

  test('rejects a duplicate pending order for the same table', async () => {
    const response = await request(app)
      .post('/api/table-orders')
      .send({
        merchant_id: 'merchant-test-f',
        table_number: 'T20',
        items: [{ name: 'Pizza', price: 12, quantity: 1 }]
      });

    assert.equal(response.status, 409);
    assert.equal(
      response.body.error,
      'Table already has a pending order'
    );
  });
});
