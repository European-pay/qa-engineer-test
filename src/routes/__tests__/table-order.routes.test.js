import { test } from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:3000';

// table orders don't need auth to create, just merchant_id in the body
function makeOrder(tableNumber, merchantId = 'merchant_tabletest') {
  return {
    merchant_id: merchantId,
    table_number: tableNumber,
    items: [{ name: 'Espresso', price: 2.5, quantity: 1 }],
    customer_name: 'Test Customer'
  };
}

test('creating a table order should return 201', async () => {
  // use a unique table number so other tests don't interfere
  const table = 90 + Math.floor(Math.random() * 9);
  const res = await fetch(`${BASE}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makeOrder(table))
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.ok(data.data.id);
  assert.strictEqual(data.data.status, 'pending');
});

// same table, same merchant, second order should be blocked
test('creating two pending orders for the same table should return 409 on the second', async () => {
  const table = 50;
  const merchantId = `dup_merchant_${Date.now()}`;

  const first = await fetch(`${BASE}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makeOrder(table, merchantId))
  });
  assert.strictEqual(first.status, 201);

  const second = await fetch(`${BASE}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makeOrder(table, merchantId))
  });
  assert.strictEqual(second.status, 409);
  const data = await second.json();
  assert.ok(data.error.toLowerCase().includes('pending'));
});

test('two different tables for the same merchant should both succeed', async () => {
  const merchantId = `multi_merchant_${Date.now()}`;

  const t1 = await fetch(`${BASE}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makeOrder(11, merchantId))
  });
  assert.strictEqual(t1.status, 201);

  const t2 = await fetch(`${BASE}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makeOrder(12, merchantId))
  });
  assert.strictEqual(t2.status, 201);
});

test('order with empty items array should be rejected', async () => {
  const res = await fetch(`${BASE}/api/table-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: 'test', table_number: 99, items: [] })
  });
  assert.strictEqual(res.status, 400);
});
