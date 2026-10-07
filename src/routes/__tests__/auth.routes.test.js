import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

test('registers a user with valid data', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'auth.valid@example.com',
      password: 'Test12345!',
      business_name: 'Valid Test Business'
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.message, 'Registration successful');
  assert.ok(response.body.token);
});

test('rejects email without TLD', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user@domain',
      password: 'Test12345!',
      business_name: 'Invalid Email Business'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Invalid email format');
});

test('rejects email without @ symbol', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'userdomain.com',
      password: 'Test12345!',
      business_name: 'Invalid Email Business'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Invalid email format');
});

test('rejects password shorter than 8 characters', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'short.password@example.com',
      password: 'Test1',
      business_name: 'Password Test Business'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    response.body.error,
    'Password must be at least 8 characters'
  );
});

test('rejects registration without business name', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'no.business@example.com',
      password: 'Test12345!'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Business name is required');
});

test('rejects duplicate email registration', async () => {
  const email = 'duplicate.auth@example.com';

  await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Test12345!',
      business_name: 'Duplicate Test Business'
    });

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Test12345!',
      business_name: 'Duplicate Test Business'
    });

  assert.strictEqual(response.status, 409);
  assert.strictEqual(response.body.error, 'Email already registered');
});

test('logs in with valid credentials', async () => {
  const email = 'login.valid@example.com';
  const password = 'Test12345!';

  await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      business_name: 'Login Test Business'
    });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.message, 'Login successful');
  assert.ok(response.body.token);
});

test('rejects login with incorrect password', async () => {
  const email = 'login.invalid@example.com';

  await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Test12345!',
      business_name: 'Login Failure Business'
    });

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: 'WrongPassword!'
    });

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.error, 'Invalid credentials');
});

test('rejects login for unknown user', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'unknown.user@example.com',
      password: 'Test12345!'
    });

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.error, 'Invalid credentials');
});

test('rejects login when credentials are missing', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'missing.password@example.com'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    response.body.error,
    'Email and password required'
  );
});