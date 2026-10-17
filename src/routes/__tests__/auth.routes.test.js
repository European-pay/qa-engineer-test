import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';

test('registration rejects an email without a top-level domain', async () => {
  const response = await request(app).post('/api/auth/register').send({
    email: 'user@domain', password: 'SecurePass123!', business_name: 'Example Co'
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid email format');
});

test('registration accepts a valid email and returns a JWT', async () => {
  const response = await request(app).post('/api/auth/register').send({
    email: `valid-${Date.now()}@example.com`, password: 'SecurePass123!', business_name: 'Example Co'
  });
  assert.equal(response.status, 201);
  assert.ok(response.body.token);
});

test('login rejects incorrect credentials', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'missing@example.com', password: 'WrongPass123!'
  });
  assert.equal(response.status, 401);
});
