import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { registerMerchant } from './test-helpers.js';

test('table orders reject a duplicate pending order for the same table', async () => {
  const { user } = await registerMerchant();
  const order = { merchant_id: user.id, table_number: 7, items: [{ name: 'Coffee', price: 3, quantity: 1 }] };
  const first = await request(app).post('/api/table-orders').send(order);
  const duplicate = await request(app).post('/api/table-orders').send(order);
  assert.equal(first.status, 201);
  assert.equal(duplicate.status, 409);
});

test('table order status updates require authentication and valid status', async () => {
  const unauthenticated = await request(app).patch('/api/table-orders/missing/status').send({ status: 'ready' });
  assert.equal(unauthenticated.status, 401);
  const { token } = await registerMerchant();
  const invalid = await request(app).patch('/api/table-orders/missing/status').set('Authorization', `Bearer ${token}`).send({ status: 'unknown' });
  assert.equal(invalid.status, 400);
});
