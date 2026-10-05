
import { test } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";

const WEBHOOK_SECRET = "test-webhook-secret-key";

// Generate the correct webhook signature
function generateSignature(body) {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");
}


// Bug D: Webhook should reject invalid signature
test("Bug D: webhook should reject invalid signature", async () => {
  // Arrange
  const body = {
    payment_id: "1",
    status: "completed",
    event_id: `event-${Date.now()}`,
  };

  // Act
  const response = await fetch(
    "http://localhost:3000/api/webhooks/payment-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": "invalid-signature",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 401);
  assert.strictEqual(data.error, "Invalid signature");
});


// Bug D: Webhook should accept valid signature
test("Bug D: webhook should accept valid signature", async () => {
  // Arrange
  const body = {
    payment_id: "1",
    status: "completed",
    event_id: `valid-${Date.now()}`,
  };

  const signature = generateSignature(body);

  // Act
  const response = await fetch(
    "http://localhost:3000/api/webhooks/payment-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.payment_id, "1");
  assert.strictEqual(data.new_status, "completed");
});


// Bug E: Duplicate webhook should not be processed twice
test("Bug E: duplicate webhook should not be processed twice", async () => {
  // Arrange
  const body = {
    payment_id: "1",
    status: "pending",
    event_id: `duplicate-${Date.now()}`,
  };

  const signature = generateSignature(body);

  // Act - First request
  const firstResponse = await fetch(
    "http://localhost:3000/api/webhooks/payment-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: JSON.stringify(body),
    }
  );

  const firstData = await firstResponse.json();

  // Act - Duplicate request
  const secondResponse = await fetch(
    "http://localhost:3000/api/webhooks/payment-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: JSON.stringify(body),
    }
  );

  const secondData = await secondResponse.json();

  // Assert
  assert.strictEqual(firstResponse.status, 200);
  assert.strictEqual(firstData.success, true);

  assert.strictEqual(secondResponse.status, 200);
  assert.strictEqual(secondData.message, "Already processed");
});


// Webhook should reject request without signature
test("Webhook should reject request without signature", async () => {
  // Arrange
  const body = {
    payment_id: "1",
    status: "completed",
    event_id: `no-signature-${Date.now()}`,
  };

  // Act
  const response = await fetch(
    "http://localhost:3000/api/webhooks/payment-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 401);
  assert.strictEqual(data.error, "Invalid signature");
});


// Webhook should reject non-existing payment
test("Webhook should reject non-existing payment", async () => {
  // Arrange
  const body = {
    payment_id: "999999",
    status: "completed",
    event_id: `missing-${Date.now()}`,
  };

  const signature = generateSignature(body);

  // Act
  const response = await fetch(
    "http://localhost:3000/api/webhooks/payment-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 404);
  assert.strictEqual(data.error, "Payment not found");
});
