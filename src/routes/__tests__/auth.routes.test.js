import { test } from 'node:test';
import assert from 'node:assert';
import '../../server.js';

const BASE_URL = 'http://localhost:3000';

test('Bug C: POST /api/auth/register should reject email without TLD', async () => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@domain',
      password: 'Password123!',
      business_name: 'Test Merchant'
    })
  });

  const data = await response.json();
  assert.strictEqual(response.status, 400);
  assert.strictEqual(data.error, 'Invalid email format');
});

test('Bug C Edge Case: POST /api/auth/register should reject email missing @ symbol', async () => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalidemail.com',
      password: 'Password123!',
      business_name: 'Test Merchant'
    })
  });

  const data = await response.json();
  assert.strictEqual(response.status, 400);
  assert.strictEqual(data.error, 'Invalid email format');
});

test('Happy Path: POST /api/auth/register should succeed with valid email', async () => {
  const uniqueEmail = `merchant_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'Password123!',
      business_name: 'Test Merchant'
    })
  });

  const data = await response.json();
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.message, 'Registration successful');
  assert.ok(data.token);
});

test('Negative Case: POST /api/auth/register should reject password shorter than 8 characters', async () => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `valid_${Date.now()}@test.com`,
      password: 'short',
      business_name: 'Test Merchant'
    })
  });

  const data = await response.json();
  assert.strictEqual(response.status, 400);
  assert.ok(data.error.includes('8 characters'));
});