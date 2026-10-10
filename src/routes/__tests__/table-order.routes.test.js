import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { resetDatabase } from '../../db/database.js';
import { registerMerchant } from './test-helpers.js';

beforeEach(() => resetDatabase());

const order = {
  merchant_id: '1',
  table_number: 7,
  items: [{ name: 'Coffee', price: 3.5, quantity: 2 }]
};

test('Bug F: duplicate pending table orders are rejected', async () => {
  const first = await request(app).post('/api/table-orders').send(order);
  const second = await request(app).post('/api/table-orders').send(order);

  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
  assert.match(second.body.error, /pending/i);
});

test('a new table order is allowed after the pending order is cancelled', async () => {
  const token = await registerMerchant('table-status');
  const merchantOrder = { ...order, merchant_id: '2' };
  const first = await request(app).post('/api/table-orders').send(merchantOrder);
  const cancelled = await request(app)
    .patch(`/api/table-orders/${first.body.data.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'cancelled' });
  const second = await request(app).post('/api/table-orders').send(merchantOrder);

  assert.equal(cancelled.status, 200);
  assert.equal(second.status, 201);
});

test('table order listing requires authentication', async () => {
  const response = await request(app).get('/api/table-orders');
  assert.equal(response.status, 401);
});
