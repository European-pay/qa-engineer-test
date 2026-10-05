import { test } from 'node:test';
import assert from 'node:assert';

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

test('placeholder test - candidates should add real tests', () => {
  assert.ok(true);
});

// TODO: Add tests for:
// - Valid email acceptance
// - Invalid email rejection (no TLD, no @, etc.)
// - Registration with valid data
// - Registration with invalid email
// - Login with correct credentials
// - Login with incorrect credentials


// Bug C: Valid email should be accepted
test("Bug C: POST /auth/register should accept valid email", async () => {
  const email = `valid-${Date.now()}@example.com`;

  const response = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "Test123!",
        business_name: "Test Business",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.message, "Registration successful");
  assert.strictEqual(data.user.email, email);
  assert.ok(data.token);
});

// Bug C: Email without TLD should be rejected
test("Bug C: POST /auth/register should reject email without TLD", async () => {
  const email = `user-${Date.now()}@domain`;

  const response = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "Test123!",
        business_name: "Test Business",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(data.error, "Invalid email format");
});

// Bug C: Email without @ should be rejected
test("Bug C: POST /auth/register should reject email without @", async () => {
  const email = `user-${Date.now()}example.com`;

  const response = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "Test123!",
        business_name: "Test Business",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(data.error, "Invalid email format");
});

// Registration should reject short password
test("Registration should reject password shorter than 8 characters", async () => {
  const email = `short-${Date.now()}@example.com`;

  const response = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "1234567",
        business_name: "Test Business",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 400);
  assert.ok(data.error.includes("8 characters"));
});

// Login with correct credentials
test("Login should work with correct credentials", async () => {
  const email = `login-${Date.now()}@example.com`;

  // Register user first
  const registerResponse = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "Test123!",
        business_name: "Test Business",
      }),
    }
  );

  assert.strictEqual(registerResponse.status, 201);

  // Login
  const response = await fetch(
    "http://localhost:3000/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "Test123!",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.message, "Login successful");
  assert.strictEqual(data.user.email, email);
  assert.ok(data.token);
});

// Login with incorrect credentials
test("Login should reject incorrect credentials", async () => {
  const email = `wrong-${Date.now()}@example.com`;

  // Register user first
  const registerResponse = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "Test123!",
        business_name: "Test Business",
      }),
    }
  );

  assert.strictEqual(registerResponse.status, 201);

  // Login with wrong password
  const response = await fetch(
    "http://localhost:3000/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "WrongPassword123!",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 401);
  assert.strictEqual(data.error, "Invalid credentials");
});
