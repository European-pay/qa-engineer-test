import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { resetDatabase } from '../../db/database.js';

beforeEach(() => resetDatabase());

test('registration accepts a valid email and returns a token', async () => {
  const response = await request(app).post('/api/auth/register').send({
    email: 'new-merchant@example.com',
    password: 'SecurePass123!',
    business_name: 'Example Business'
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, 'new-merchant@example.com');
  assert.ok(response.body.token);
});

test('Bug C: registration rejects an email without a top-level domain', async () => {
  const response = await request(app).post('/api/auth/register').send({
    email: 'user@domain',
    password: 'SecurePass123!',
    business_name: 'Example Business'
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /email/i);
});

test('registration rejects malformed email addresses', async () => {
  const response = await request(app).post('/api/auth/register').send({
    email: 'not-an-email',
    password: 'SecurePass123!',
    business_name: 'Example Business'
  });

  assert.equal(response.status, 400);
});

test('login rejects incorrect credentials', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'merchant@test.com',
    password: 'incorrect-password'
  });

  assert.equal(response.status, 401);
});
