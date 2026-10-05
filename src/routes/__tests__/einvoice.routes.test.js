import { test } from "node:test";
import assert from "node:assert";

// Register a fresh merchant and return JWT token
async function registerAndGetToken() {
  const email = `einvoice-${Date.now()}@example.com`;

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
        business_name: "E-Invoice Test Business",
      }),
    }
  );

  const data = await response.json();

  assert.strictEqual(response.status, 201);

  return data.token;
}


// Bug G: Duplicate e-invoice submission should be rejected
test("Bug G: POST /einvoice/submit should reject duplicate submission", async () => {
  // Arrange
  const token = await registerAndGetToken();

  const invoiceId = `invoice-${Date.now()}`;

  const invoice = {
    invoice_id: invoiceId,
    customer_siret: "12345678901234",
  };

  // First submission
  const firstResponse = await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoice),
    }
  );

  const firstData = await firstResponse.json();

  // Second submission
  const secondResponse = await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoice),
    }
  );

  const secondData = await secondResponse.json();

  // Assert
  assert.strictEqual(firstResponse.status, 200);
  assert.strictEqual(firstData.success, true);
  assert.strictEqual(firstData.data.status, "submitted");

  assert.strictEqual(secondResponse.status, 409);
  assert.ok(
    secondData.error.includes("already submitted")
  );
});


// E-Invoice should submit valid invoice
test("POST /einvoice/submit should submit valid invoice", async () => {
  // Arrange
  const token = await registerAndGetToken();

  // Act
  const response = await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_id: `invoice-${Date.now()}`,
        customer_siret: "12345678901234",
      }),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(
    data.message,
    "Invoice submitted to tax authority"
  );
  assert.strictEqual(data.data.status, "submitted");
  assert.ok(data.data.submission_id);
});


// E-Invoice should reject invalid SIRET
test("E-Invoice should reject invalid SIRET", async () => {
  // Arrange
  const token = await registerAndGetToken();

  // Act
  const response = await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_id: `invoice-${Date.now()}`,
        customer_siret: "12345",
      }),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 400);
  assert.ok(data.error.includes("14 digits"));
});


// E-Invoice should reject missing invoice_id
test("E-Invoice should reject missing invoice_id", async () => {
  // Arrange
  const token = await registerAndGetToken();

  // Act
  const response = await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_siret: "12345678901234",
      }),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    data.error,
    "invoice_id required"
  );
});


// E-Invoice should require authentication
test("E-Invoice should reject request without authentication", async () => {
  // Act
  const response = await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_id: `invoice-${Date.now()}`,
        customer_siret: "12345678901234",
      }),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 401);
  assert.strictEqual(
    data.error,
    "Authentication required"
  );
});


// E-Invoice status should be available after submission
test("GET /einvoice/status/:id should return submitted status", async () => {
  // Arrange
  const token = await registerAndGetToken();

  const invoiceId = `invoice-${Date.now()}`;

  await fetch(
    "http://localhost:3000/api/einvoice/submit",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
        customer_siret: "12345678901234",
      }),
    }
  );

  // Act
  const response = await fetch(
    `http://localhost:3000/api/einvoice/status/${invoiceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(
    data.data.invoice_id,
    invoiceId
  );
  assert.strictEqual(
    data.data.einvoice_status,
    "submitted"
  );
  assert.ok(data.data.submission_id);
});
