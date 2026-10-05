# Bug Reports

## Bug A: Payment Amount Returned as String

**Location:** `src/routes/payment.routes.js` — `GET /api/payments`  
**Severity:** Medium  
**Component:** Payment API

**How to Reproduce:**

1. Start the server:`npm start`

2. Register or login as a merchant to obtain a JWT token.
3. Create a payment:
   ```http
   POST /api/payments
   ```
   with:
   ```json
   {
     "amount": 25.5,
     "currency": "EUR",
     "customer_email": "customer@test.com"
   }
   ```
4. Note the returned payment ID.
5. Request:
   ```http
   GET /api/payments/{payment_id}
   ```
   with the JWT token.
6. Observe the `amount` field.

**Expected Behavior:**

The API should return `amount` as a JSON number:

```json
{
  "amount": 25.5
}
```

**Actual Behavior:**

The payment detail endpoint returned the amount as a string:

```json
{
  "amount": "25.5"
}
```

**Impact:**

Clients expecting a numeric payment amount may perform incorrect calculations or require unnecessary type conversion. This creates an inconsistent API contract because the payment list endpoint returns the amount as a number.

**Root Cause:**

The detail endpoint converted the numeric value to a string:

```js
amount: payment.amount.toString()
```

**Suggested Fix:**

Return the stored numeric value directly:

```js
amount: payment.amount
```

---

## Bug B: Payment Amount Maximum Limit

**Location:** `src/routes/payment.routes.js` — `POST /api/payments`  
**Severity:** High  
**Component:** Payment API

**How to Reproduce:**

1. Start the API.
2. Authenticate as a merchant.
3. Send:
   ```http
   POST /api/payments
   ```
4. Use an amount greater than the allowed maximum:
   ```json
   {
     "amount": 999999,
     "currency": "EUR",
     "customer_email": "customer@test.com"
   }
   ```

**Expected Behavior:**

Payments above €50,000 should be rejected with HTTP `400`.

**Actual Behavior Before Fix:**

The API could accept an amount exceeding the configured maximum.

**Impact:**

An attacker or client-side validation bypass could create payments with unexpectedly large values. This could cause financial, fraud, or business-rule violations.

**Root Cause:**

The payment creation flow did not enforce the maximum amount at the API boundary.

**Suggested Fix:**

Validate the amount before creating the payment:

```js
if (amount > 50000) {
  return res.status(400).json({
    error: 'Amount exceeds maximum limit of 50,000'
  });
}
```

---

## Bug C: Invalid Email `user@domain` Accepted

**Location:** `src/routes/auth.routes.js` — `POST /api/auth/register`  
**Severity:** Medium  
**Component:** Auth API

**How to Reproduce:**

1. Start the API.
2. Send:
   ```http
   POST /api/auth/register
   ```
3. Use:
   ```json
   {
     "email": "user@domain",
     "password": "Test123!",
     "business_name": "Test Business"
   }
   ```

**Expected Behavior:**

The API should reject an email without a domain extension and return HTTP `400`.

**Actual Behavior Before Fix:**

The weak email validation could accept `user@domain`.

**Impact:**

Invalid email addresses could enter the system, causing problems with authentication, notifications, customer communication, and account recovery.

**Root Cause:**

The email validation did not require a domain/TLD portion.

**Suggested Fix:**

Use validation requiring text after the `@` and a dot:

```js
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

---

## Bug D: Webhook Signature Verification
**Location:** `src/routes/webhook.routes.js` — `POST /api/webhooks/payment-status`  
**Severity:** Critical  
**Component:** Webhooks

**How to Reproduce:**

1. Start the API.
2. Send a payment-status webhook.
3. Provide an invalid signature:
   ```http
   X-Webhook-Signature: invalid-signature
   ```
4. Send:
   ```json
   {
     "payment_id": "1",
     "status": "completed",
     "event_id": "event-001"
   }
   ```

**Expected Behavior:**

The webhook should reject the request with HTTP `401`.

**Actual Behavior Before Fix:**

A webhook without proper signature validation could potentially modify payment state.

**Impact:**

An attacker could forge webhook requests and mark payments as completed or otherwise manipulate payment status.

**Root Cause:**

The webhook endpoint required cryptographic signature validation. Without verifying the HMAC-SHA256 signature against the trusted webhook secret, the request cannot be authenticated.

**Suggested Fix:**

Calculate the expected HMAC signature and compare it with the request signature:

```js
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Bug E: Duplicate Webhook Processing

**Location:** `src/routes/webhook.routes.js` — `POST /api/webhooks/payment-status`  
**Severity:** High  
**Component:** Webhooks

**How to Reproduce:**

1. Start the API.
2. Create a valid payment-status webhook.
3. Send the same webhook twice using the same `event_id`:
   ```json
   {
     "payment_id": "1",
     "status": "completed",
     "event_id": "event-001"
   }
   ```
4. Send the request again with the same `event_id`.

**Expected Behavior:**

The first request should be processed. The second request should not perform the operation again.

**Actual Behavior Before Fix:**

The same webhook could be processed more than once.

**Impact:**

Duplicate webhook processing can result in duplicate payment updates, duplicate notifications, duplicate downstream events, or financial inconsistencies.

**Root Cause:**

Webhook event IDs were not being tracked before processing.

**Suggested Fix:**

Store processed event IDs and check them before processing:

```js
if (db.processed_webhooks.includes(event_id)) {
  return res.status(200).json({
    message: 'Already processed'
  });
}
```

After successful processing:

```js
db.processed_webhooks.push(event_id);
```

---

## Bug F: Duplicate Pending Table Orders

**Location:** `src/routes/table-order.routes.js` — `POST /api/table-orders`  
**Severity:** High  
**Component:** Table Orders

**How to Reproduce:**

1. Start the API.
2. Submit a table order:
   ```json
   {
     "merchant_id": "1",
     "table_number": 5,
     "items": [
       {
         "name": "Burger",
         "price": 10,
         "quantity": 1
       }
     ]
   }
   ```
3. Submit the exact same table order again while the first order is still pending.

**Expected Behavior:**

The second pending order for the same merchant and table should be rejected with HTTP `409`.

**Actual Behavior Before Fix:**

Multiple pending orders could be created for the same table.

**Impact:**

Duplicate orders can cause restaurants to prepare the same customer order multiple times and create incorrect billing and operational data.

**Root Cause:**

The API needed to check for an existing pending order before creating a new one.

**Suggested Fix:**

Check for an existing pending order:

```js
const existingOrder = (db.table_orders || []).find(
  o =>
    o.merchant_id === merchant_id &&
    o.table_number === table_number &&
    o.status === 'pending'
);

if (existingOrder) {
  return res.status(409).json({
    error: 'A pending order already exists for this table'
  });
}
```

---

## Bug G: Duplicate E-Invoice Submission

**Location:** `src/routes/einvoice.routes.js` — `POST /api/einvoice/submit`  
**Severity:** High  
**Component:** E-Invoice

**How to Reproduce:**

1. Authenticate as a merchant.
2. Submit an invoice:
   ```json
   {
     "invoice_id": "invoice-001",
     "customer_siret": "12345678901234"
   }
   ```
3. Submit the same invoice again.

**Expected Behavior:**

The first submission should succeed. A second submission should return HTTP `409`.

**Actual Behavior Before Fix:**

The same invoice could be submitted more than once.

**Impact:**

Duplicate submissions to a tax authority can create duplicate fiscal records and compliance issues.

**Root Cause:**

The invoice submission state was not checked before creating a new submission.

**Suggested Fix:**
Reject invoices already submitted:

```js
if (
  invoice.einvoice_status === 'submitted' ||
  invoice.einvoice_status === 'accepted'
) {
  return res.status(409).json({
    error: 'Invoice already submitted to tax authority'
  });
}
```