import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../app.js';
import { setupTestDatabase } from './test-setup.js';

setupTestDatabase()


test('POST /api/table-orders create test table-orders', async () => {

  const items = [
    {
    name:'Pasta',
    price:100,
    quantity:2
    },{
    name:'Noodles',
    price:120,
    quantity:1
    }
  ]
  const response = await request(app)
    .post('/api/table-orders')
    .send({
      merchant_id:'1',
      table_number:'5',
      items:items,
      customer_name:'Alex',
      order_type:'dine_in'
    });

  assert.equal(response.body.data.status,'pending')
  assert.equal(response.body.success,true)
  assert.equal(response.body.message,'Table order created')
  assert.equal(response.status, 201);
});

test('POST /api/table-orders prevent creation of table-order if it has already pending request', async () => {
  const items = [
    {
    name:'Momos',
    price:90,
    quantity:2
    },{
    name:'Butter Chicken',
    price:250,
    quantity:1
    }
  ]
  const response = await request(app)
    .post('/api/table-orders')
    .send({
      merchant_id:'1',
      table_number:'5',
      items:items,
      customer_name:'david',
      order_type:'dine_in'
    });

  assert.equal(response.body.error,'Table already has a pending order')
  assert.equal(response.status, 409);
});