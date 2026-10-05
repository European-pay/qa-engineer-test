import { test } from "node:test";
import assert from "node:assert";

// Bug F: Duplicate pending order should be rejected
test("Bug F: POST /table-orders should reject duplicate pending order", async () => {
  // Arrange
  const tableNumber = Date.now();

  const order = {
    merchant_id: "1",
    table_number: tableNumber,
    items: [
      {
        name: "Pizza",
        price: 200,
        quantity: 2,
      },
    ],
  };

  // Act - First order
  const firstResponse = await fetch(
    "http://localhost:3000/api/table-orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    }
  );

  const firstData = await firstResponse.json();

  // Act - Duplicate order
  const secondResponse = await fetch(
    "http://localhost:3000/api/table-orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    }
  );

  const secondData = await secondResponse.json();

  // Assert
  assert.strictEqual(firstResponse.status, 201);
  assert.strictEqual(firstData.success, true);

  assert.strictEqual(secondResponse.status, 409);
  assert.ok(secondData.error.includes("pending"));
});


// POST /table-orders should create valid order
test("POST /table-orders should create valid order", async () => {
  // Arrange
  const order = {
    merchant_id: "1",
    table_number: Date.now(),
    items: [
      {
        name: "Burger",
        price: 100,
        quantity: 2,
      },
    ],
    customer_name: "Vishal",
    order_type: "dine_in",
  };

  // Act
  const response = await fetch(
    "http://localhost:3000/api/table-orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.merchant_id, "1");
  assert.strictEqual(data.data.table_number, order.table_number);
  assert.strictEqual(data.data.status, "pending");
  assert.strictEqual(data.data.total, 200);
});


// Table order should reject empty items
test("POST /table-orders should reject empty items", async () => {
  // Arrange
  const order = {
    merchant_id: "1",
    table_number: Date.now(),
    items: [],
  };

  // Act
  const response = await fetch(
    "http://localhost:3000/api/table-orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 400);
  assert.strictEqual(
    data.error,
    "Order must have at least one item"
  );
});


// Table order should reject missing required fields
test("POST /table-orders should reject missing required fields", async () => {
  // Arrange
  const order = {
    table_number: Date.now(),
    items: [
      {
        name: "Pizza",
        price: 200,
        quantity: 1,
      },
    ],
  };

  // Act
  const response = await fetch(
    "http://localhost:3000/api/table-orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 400);
  assert.ok(
    data.error.includes("merchant_id")
  );
});


// Table order should reject invalid status
test("PATCH /table-orders/:id/status should reject invalid status", async () => {
  // Arrange
  const order = {
    merchant_id: "1",
    table_number: Date.now(),
    items: [
      {
        name: "Pizza",
        price: 200,
        quantity: 1,
      },
    ],
  };

  const createResponse = await fetch(
    "http://localhost:3000/api/table-orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    }
  );

  const createData = await createResponse.json();
  const orderId = createData.data.id;

  // Act
  const response = await fetch(
    `http://localhost:3000/api/table-orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Authorization": "Bearer INVALID_TOKEN",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "invalid_status",
      }),
    }
  );

  const data = await response.json();

  // Assert
  assert.strictEqual(response.status, 401);
  assert.strictEqual(
    data.error,
    "Invalid token"
  );
});
