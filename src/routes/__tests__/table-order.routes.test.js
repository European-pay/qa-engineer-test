import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

describe('Table Order Routes Tests', () => {
  const merchantId = 'test-merchant-uuid-123';
  const tableNum = Math.floor(Math.random() * 100) + 1;

  describe('POST /api/table-orders', () => {
    test('should create a new table order successfully', async () => {
      const res = await request(app)
        .post('/api/table-orders')
        .send({
          merchant_id: merchantId,
          table_number: tableNum,
          items: [{ name: 'Burger', price: 12.0, quantity: 1 }],
          customer_name: 'Alice'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'pending');
    });

    test('should prevent duplicate pending orders for the same table', async () => {
      const res = await request(app)
        .post('/api/table-orders')
        .send({
          merchant_id: merchantId,
          table_number: tableNum,
          items: [{ name: 'Fries', price: 4.0, quantity: 2 }],
          customer_name: 'Bob'
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error, 'Table already has a pending order');
    });
  });
});