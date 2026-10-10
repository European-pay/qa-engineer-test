import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';

test('registration rejects an address without a domain suffix', async () => {
  const response = await request(app).post('/api/auth/register').send({ email: 'user@domain', password: 'SecurePass123!', business_name: 'Example Co' });
  assert.equal(response.status, 400);
});

test('registration accepts a valid email and login returns a token', async () => {
  const email = `qa-${Date.now()}@example.com`;
  const registered = await request(app).post('/api/auth/register').send({ email, password: 'SecurePass123!', business_name: 'Example Co' });
  assert.equal(registered.status, 201);
  const login = await request(app).post('/api/auth/login').send({ email, password: 'SecurePass123!' });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
});

test('seed merchant credentials work and incorrect password is rejected', async () => {
  assert.equal((await request(app).post('/api/auth/login').send({ email: 'merchant@test.com', password: 'Test123!' })).status, 200);
  assert.equal((await request(app).post('/api/auth/login').send({ email: 'merchant@test.com', password: 'wrong-password' })).status, 401);
});
