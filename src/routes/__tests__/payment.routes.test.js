import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Payment Routes Tests
 * 
 * Candidates should add tests here for Bug A (amount type)
 * 
 * Example test structure:
 * 
 * test('should return amount as number not string', async () => {
 *   const response = await getPayments();
 *   assert.strictEqual(typeof response.data[0].amount, 'number');
 * });
 */

test('placeholder test - candidates should add real tests', () => {
  assert.ok(true);
});

// TODO: Add tests for:
// - GET /payments returns amount as number
// - GET /payments/:id returns amount as number
// - POST /payments with valid data
// - POST /payments with negative amount (should fail)
// - POST /payments with zero amount (should fail)
// - POST /payments with very large amount (> €50,000)
// - POST /payments without authentication

// Register a fresh merchant and return the JWT token
async function registerAndGetToken() {
  const email = `payment-${Date.now()}@example.com`;

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
        business_name: "Payment Test Business",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 201);

  return data.token;
}


// Bug A: GET /payments/:id should return amount as number
test("Bug A: GET /payments should return amount as number", async () => {
  // Arrange
  const token = await registerAndGetToken();

  const createResponse = await fetch(
    "http://localhost:3000/api/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 25.5,
        currency: "EUR",
        customer_email: "customer@test.com",
      }),
    }
  );

  const createData = await createResponse.json();


  // Act
  const response = await fetch(
    "http://localhost:3000/api/payments",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(typeof data.data[0].amount, "number");
  assert.strictEqual(data.data[0].amount, 25.5);
});


// POST /payments should create valid payment
test("POST /payments should create payment with valid data", async () => {
  // Arrange
  const token = await registerAndGetToken();

  // Act
  const response = await fetch(
    "http://localhost:3000/api/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        currency: "EUR",
        customer_email: "customer@test.com",
      }),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.amount, 100);
  assert.strictEqual(data.data.currency, "EUR");
  assert.strictEqual(data.data.status, "pending");
});


// POST /payments should reject negative amount
test("POST /payments should reject negative amount", async () => {
  const token = await registerAndGetToken();

  const response = await fetch(
    "http://localhost:3000/api/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: -100,
        currency: "EUR",
        customer_email: "customer@test.com",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 400);
  assert.ok(data.error.includes("amount"));
});


// POST /payments should reject zero amount
test("POST /payments should reject zero amount", async () => {
  const token = await registerAndGetToken();

  const response = await fetch(
    "http://localhost:3000/api/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 0,
        currency: "EUR",
        customer_email: "customer@test.com",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 400);
  assert.ok(data.error.includes("amount"));
});


// Bug B: POST /payments should reject amount over €50,000
test("Bug B: POST /payments should reject amount over €50,000", async () => {
  const token = await registerAndGetToken();

  const response = await fetch(
    "http://localhost:3000/api/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 50001,
        currency: "EUR",
        customer_email: "customer@test.com",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 400);
  assert.ok(data.error.includes("maximum"));
});


// POST /payments should reject request without authentication
test("POST /payments should reject without authentication", async () => {
  const response = await fetch(
    "http://localhost:3000/api/payments",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        currency: "EUR",
        customer_email: "customer@test.com",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 401);
  assert.strictEqual(
    data.error,
    "Authentication required"
  );
});
