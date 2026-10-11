import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

describe('Auth Routes & Validation Tests', () => {
  const testEmail = `candidate_test_${Date.now()}@domain.com`;
  const invalidEmailNoTld = 'user@domain';
  const invalidEmailNoAt = 'userdomain.com';

  test('should reject registration with email without TLD (Bug C)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: invalidEmailNoTld,
        password: 'securepassword123',
        business_name: 'Test Business'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Invalid email format');
  });

  test('should reject registration with invalid email lacking @ symbol', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: invalidEmailNoAt,
        password: 'securepassword123',
        business_name: 'Test Business'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Invalid email format');
  });

  test('should register successfully with valid email data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'securepassword123',
        business_name: 'Test Merchant'
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token, 'Response should contain a token');
    assert.strictEqual(res.body.user.email, testEmail);
  });

  test('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'securepassword123'
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token, 'Response should contain a token on login');
  });

  test('should fail login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'wrongpassword'
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Invalid credentials');
  });
});
