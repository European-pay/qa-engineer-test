import { test, before } from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:3000';

// register a fresh merchant before auth tests so we're not depending on seeded data
let testEmail;
before(async () => {
  testEmail = `merchant_${Date.now()}@test.com`;
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Test123!', business_name: 'Test Co' })
  });
});

test('register with valid email and password should succeed', async () => {
  const email = `newuser_${Date.now()}@example.com`;
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test123!', business_name: 'My Shop' })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.ok(data.token);
});

// the old regex let stuff like "user@nodomain" through — making sure the fix holds
test('register with email missing TLD should be rejected', async () => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@nodomain', password: 'Test123!', business_name: 'Bad Email Co' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.toLowerCase().includes('email'));
});

test('login with correct credentials should return a token', async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Test123!' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.token, 'expected a JWT in the response');
  assert.strictEqual(typeof data.token, 'string');
});

test('login with wrong password should return 401', async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' })
  });
  assert.strictEqual(res.status, 401);
});
