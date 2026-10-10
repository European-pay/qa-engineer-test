import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';

test('table order rejects a second pending order for the same merchant and table', async () => {
  const table_number = `qa-${Date.now()}`;
  const body = { merchant_id: '1', table_number, items: [{ name: 'Coffee', price: 3, quantity: 1 }] };
  assert.equal((await request(app).post('/api/table-orders').send(body)).status, 201);
  const duplicateWithNumericMerchantId = { ...body, merchant_id: 1 };
  assert.equal((await request(app).post('/api/table-orders').send(duplicateWithNumericMerchantId)).status, 409);
});

test('table order allows a new order after the prior order is no longer pending', async () => {
  const login = await request(app).post('/api/auth/login').send({ email: 'merchant@test.com', password: 'Test123!' });
  const table_number = `done-${Date.now()}`;
  const body = { merchant_id: '1', table_number, items: [{ name: 'Tea', price: 2, quantity: 1 }] };
  const created = await request(app).post('/api/table-orders').send(body);
  await request(app).patch(`/api/table-orders/${created.body.data.id}/status`)
    .set({ Authorization: `Bearer ${login.body.token}` })
    .send({ status: 'served' });
  assert.equal((await request(app).post('/api/table-orders').send(body)).status, 201);
});
