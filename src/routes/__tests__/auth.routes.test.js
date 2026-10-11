import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../app.js';
import { setupTestDatabase } from './test-setup.js';

setupTestDatabase();

/**
 * Auth Routes Tests
 * 
 * Candidates should add tests here for Bug C (email validation)
 * 
 * Example test structure:
 * 
 * test('should reject email without TLD', async () => {
 *   const result = validateEmail('user@domain');
 *   assert.strictEqual(result, false);
 * });
 */

// - Valid email acceptance
test('POST /api/auth/register accepts user with valid email', async () => {

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email:'john@mail.com',
      password:'john123#',
      business_name:'Test Merchant 2',
      type:'merchant'
    });

  assert.equal(response.status, 201);
});

// - Invalid email rejection (no TLD, no @, etc.)
test('POST /api/auth/register Invalid email rejection', async () => {

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email:'mike@mail',//no TLD
      password:'mike123#',
      business_name:'Test Merchant 3',
      type:'merchant'
    });

  assert.equal(response.status, 400);
});

// - Registration with valid data
test('POST /api/auth/register Registration with valid data', async () => {
  
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email:'kevin@mail.com',
      password:'kevin123#',
      business_name:'Test Merchant',
      type:'merchant'
    });

  assert.equal(response.status, 201);
});

// - Registration with invalid email
test('POST /api/auth/register Registration with invalid email', async () => {
  
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email:'kevin.mail.com',//No @
      password:'kevin123#',
      business_name:'Test Merchant',
      type:'merchant'
    });

  assert.equal(response.status, 400);
});

// - Login with correct credentials
test('POST /api/auth/login Login with correct credentials', async () => {
  
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email:"merchant@test.com",
      password:"Test123!"
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'Login successful');
});

// - Login with incorrect credentials
test('POST /api/auth/login Login with incorrect credentials', async () => {
  
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email:"merchant@test.com",
      password:"test123!"//incorrect: password
    });

  assert.equal(response.status, 401);
});

// TODO: Add tests for:
// - Valid email acceptance
// - Invalid email rejection (no TLD, no @, etc.)
// - Registration with valid data
// - Registration with invalid email
// - Login with correct credentials
// - Login with incorrect credentials