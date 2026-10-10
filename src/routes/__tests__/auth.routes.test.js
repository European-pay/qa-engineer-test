import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';
import { v4 as uuidv4 } from 'uuid';

test('Bug C: Auth - should reject email without TLD', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: `test${uuidv4()}@domain`,
      password: 'Password123!',
      business_name: 'Test Business'
    });
  
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error, 'Invalid email format');
});

test('Auth - should accept valid email', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: `test${uuidv4()}@domain.com`,
      password: 'Password123!',
      business_name: 'Test Business'
    });
  
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.token);
});

test('Auth - should login with correct credentials', async () => {
  const email = `testlogin${uuidv4()}@domain.com`;
  const password = 'Password123!';
  
  await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      business_name: 'Test Business'
    });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password
    });
  
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.token);
});

test('Auth - should reject login with incorrect credentials', async () => {
  const email = `testlogin2${uuidv4()}@domain.com`;
  const password = 'Password123!';
  
  await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      business_name: 'Test Business'
    });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: 'WrongPassword!'
    });
  
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Invalid credentials');
});
