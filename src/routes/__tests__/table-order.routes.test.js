import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

test('Bug F: Table Orders - should prevent duplicate pending orders', async () => {
  const payload = {
    merchant_id: '1',
    table_number: '10',
    items: [{ name: 'Burger', price: 10, quantity: 1 }],
    customer_name: 'Test Customer',
    order_type: 'dine_in'
  };

  // First order should succeed
  const res1 = await request(app)
    .post('/api/table-orders')
    .send(payload);
  
  assert.strictEqual(res1.status, 201);

  // Second order on same table should fail
  const res2 = await request(app)
    .post('/api/table-orders')
    .send(payload);
  
  assert.strictEqual(res2.status, 409);
  assert.strictEqual(res2.body.error, 'Table already has a pending order');
});
