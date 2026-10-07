import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

async function getAuthToken() {
  const email = 'table.order.test@example.com';
  const password = 'Test12345!';

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      business_name: 'Table Order Test Business'
    });

  if (registerResponse.status === 201) {
    return {
      token: registerResponse.body.token,
      merchantId: String(registerResponse.body.user.id)
    };
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password
    });

  return {
    token: loginResponse.body.token,
    merchantId: String(loginResponse.body.user.id)
  };
}

test('creates a table order with valid data', async () => {
  const { merchantId } = await getAuthToken();

  const response = await request(app)
    .post('/api/table-orders')
    .send({
      merchant_id: merchantId,
      table_number: 10,
      items: [
        {
          name: 'Test Burger',
          price: 100,
          quantity: 1
        }
      ]
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.data.status, 'pending');
});

test('rejects duplicate pending order for the same table', async () => {
  const { merchantId } = await getAuthToken();

  const order = {
    merchant_id: merchantId,
    table_number: 20,
    items: [
      {
        name: 'Test Pizza',
        price: 200,
        quantity: 1
      }
    ]
  };

  const firstResponse = await request(app)
    .post('/api/table-orders')
    .send(order);

  assert.strictEqual(firstResponse.status, 201);

  const secondResponse = await request(app)
    .post('/api/table-orders')
    .send(order);

  assert.strictEqual(secondResponse.status, 409);
  assert.strictEqual(
    secondResponse.body.error,
    'Table already has a pending order'
  );
});

test('allows a new order when the existing table order is no longer pending', async () => {
  const { token, merchantId } = await getAuthToken();

  const order = {
    merchant_id: merchantId,
    table_number: 30,
    items: [
      {
        name: 'Test Pasta',
        price: 150,
        quantity: 1
      }
    ]
  };

  const firstResponse = await request(app)
    .post('/api/table-orders')
    .send(order);

  assert.strictEqual(firstResponse.status, 201);

  const orderId = firstResponse.body.data.id;

  const statusResponse = await request(app)
    .patch(`/api/table-orders/${orderId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'served'
    });

  assert.strictEqual(statusResponse.status, 200);
  assert.strictEqual(statusResponse.body.data.status, 'served');

  const secondResponse = await request(app)
    .post('/api/table-orders')
    .send(order);

  assert.strictEqual(secondResponse.status, 201);
});

test('rejects table order without items', async () => {
  const { merchantId } = await getAuthToken();

  const response = await request(app)
    .post('/api/table-orders')
    .send({
      merchant_id: merchantId,
      table_number: 40,
      items: []
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    response.body.error,
    'Order must have at least one item'
  );
});