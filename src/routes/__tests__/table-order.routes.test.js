import { test } from 'node:test';
import assert from 'node:assert';
import '../../server.js';

const BASE_URL = 'http://localhost:3000';

test('Happy Path: POST /table-orders should create table order', async () => {
  const tableNum = Math.floor(Math.random() * 1000) + 100;
  const response = await fetch(`${BASE_URL}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: '1',
      table_number: tableNum,
      items: [{ name: 'Pizza', price: 15.0, quantity: 1 }],
      customer_name: 'Alex'
    })
  });

  const data = await response.json();
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.data.status, 'pending');
});

test('Bug F: Duplicate table order on pending table should reject with 409', async () => {
  const tableNum = Math.floor(Math.random() * 1000) + 500;
  const orderData = {
    merchant_id: '1',
    table_number: tableNum,
    items: [{ name: 'Salad', price: 8.0, quantity: 1 }],
    customer_name: 'Diner'
  };

  // First order
  const res1 = await fetch(`${BASE_URL}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  assert.strictEqual(res1.status, 201);

  // Duplicate order
  const res2 = await fetch(`${BASE_URL}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  const data2 = await res2.json();
  assert.strictEqual(res2.status, 409);
  assert.strictEqual(data2.error, 'Table already has a pending order');
});