# Bug Reports

## Bug A — Payment Amount Returned as String

**Severity:** Medium

**Location:** `src/routes/payment.routes.js`

### Description

The Payment API returned the `amount` field as a string instead of a numeric value.

### Steps to Reproduce

1. Register a merchant and obtain a JWT token.
2. Create a payment using:
   - Amount: `25.50`
   - Currency: `EUR`
   - Customer email: `customer@example.com`
3. Call `GET /api/payments`.
4. Inspect the `amount` field in the response.

### Expected Result

The `amount` field should be returned as a numeric value.

Example:

```json
{
  "amount": 25.5
}
```

---
### Actual Result

The amount field was returned as a string.

Example:

```json
{
  "amount": "25.5"
}
```

### Root Cause

The payment routes explicitly converted the amount to a string using:

```text
amount: p.amount.toString()
```

and:
```text
amount: payment.amount.toString()
```

### Fix

Removed the `.toString()` conversion so the API returns the numeric database value directly.

---
## Bug B — No Maximum Payment Amount Validation

**Severity:** High

**Location:** `src/routes/payment.routes.js`

### Description

The Payment API accepted payment amounts greater than the required maximum limit of €50,000.

### Steps to Reproduce

1. Register a merchant and obtain a JWT token.
2. Send a payment request with:
   - Amount: `999999999`
   - Currency: `EUR`
   - Customer email: `customer@example.com`
3. Send the request to `POST /api/payments`.

Example request:
```json
{
  "amount": 999999999,
  "currency": "EUR",
  "customer_email": "customer@example.com"
}
```

### Expected Result

The API should reject payment amounts above `€50,000` with HTTP status `400`.

---
### Actual Result

The API accepted the payment and created the transaction successfully.


### Root Cause

The payment route validated that the amount was positive but did not enforce the maximum allowed payment amount.

### Fix

Added a maximum amount validation:

```t
if (amount > 50000) {
  return res.status(400).json({
    error: 'Payment amount cannot exceed €50,000'
  });
}
```

Payments above `€50,000` are now rejected with HTTP `400`.

---
## Bug C — Invalid Email Format Accepted

**Severity**: Medium

**Location:** `src/routes/auth.routes.js`

### Description

The registration API accepted email addresses without a valid domain extension.

### Steps to Reproduce

1. Send a registration request to `POST /api/auth/register`.
2. Use the following email:
`user@domain`

3. Provide a valid password and business name.

Example request:
```json
{
  "email": "user@domain",
  "password": "Test12345!",
  "business_name": "Test Business"
}
```

### Expected Result

The API should reject the email because it does not contain a valid domain extension such as .com.

---
### Actual Result

The API accepted the registration.

### Root Cause

The email validation regular expression only checked for the presence of `@` and did not require a domain extension.

### Fix

Updated the email validation regex to:

const emailRegex = `/^[^\s@]+@[^\s@]+\.[^\s@]+$/;`

The API now rejects emails such as `user@domain`.

---
## Bug D — Webhook Signature Not Verified

**Severity:** Critical

**Location:** `src/routes/webhook.routes.js`

### Description

The payment webhook endpoint accepted requests with forged or invalid signatures.

### Steps to Reproduce

1. Create a valid payment.
2. Send a request to:
`POST /api/webhooks/payment-status`

3. Use an invalid signature:
`x-webhook-signature: fake-signature`

4. Provide a valid payment ID and status.

Example request:

```json
{
  "payment_id": 3,
  "status": "completed",
  "event_id": "evt-test-001"
}
```

### Expected Result

The webhook should reject the request with HTTP status `401`.

---
### Actual Result

The webhook accepted the request and updated the payment status.

### Root Cause

The endpoint did not verify the received webhook `signature` against the expected `HMAC-SHA256` signature.

### Fix

Implemented `HMAC-SHA256` signature verification using the configured webhook secret.

The API now calculates the expected signature and compares it with the x-webhook-signature header.

Invalid signatures are rejected with `HTTP 401`.

---
## Bug E — Duplicate Webhook Events Accepted

**Severity:** High

**Location:** `src/routes/webhook.routes.js`

### Description

The webhook endpoint processed the same webhook event more than once.

### Steps to Reproduce

1. Create a valid payment.
2. Send a valid payment-status webhook with an event_id.

Example request:
```json
{
  "payment_id": 3,
  "status": "completed",
  "event_id": "evt-test-001"
}
```

3. Send the exact same request again with the same event_id.

### Expected Result

The first request should be processed successfully.

The second request should not process the same event again.

---
### Actual Result

Both requests were accepted and processed.

### Root Cause

The endpoint did not track previously processed webhook event IDs.

### Fix

Added an idempotency check using event_id.

The API now checks whether the event ID has already been processed.

Already processed events return:
```json
{
  "success": true,
  "message": "Already processed"
}
```

This prevents the same webhook event from being 
processed multiple times.

---
## Bug F — Duplicate Pending Table Orders Allowed

**Severity:** Medium

**Location:** `src/routes/table-order.routes.js`

### Description

The API allowed multiple pending orders to be created for the same merchant and table.

### Steps to Reproduce

1. Create a valid table order for a merchant.
2. Use the same merchant ID and table number.
3. Submit another order for the same table while the first order is still pending.

Example request:
```json
{
  "merchant_id": "2",
  "table_number": 10,
  "items": [
    {
      "name": "Test Burger",
      "price": 100,
      "quantity": 1
    }
  ]
}
```

4. Send the same request again before the first order is completed.

### Expected Result

The second pending order should be rejected because the table already has an active pending order.

### Actual Result

The API created another pending order for the same table.

### Root Cause

The table-order endpoint did not check whether a pending order already existed for the same merchant and table.

### Fix

Added a duplicate check using:
- `merchant_id`
- `table_number`
- `status === 'pending'`

The API now returns `HTTP 409` when a duplicate pending order is detected.

Example response:
```json
{
  "error": "Table already has a pending order"
}
```
---
## Bug G — Duplicate E-Invoice Submission Allowed

**Severity:** Medium

**Location:** `src/routes/einvoice.routes.js`

### Description

The e-invoice API allowed the same invoice to be submitted multiple times.

### Steps to Reproduce

1. Authenticate as a merchant.
2. Submit an e-invoice using:
```json
{
  "invoice_id": "INV-QA-001",
  "customer_siret": "12345678901234"
}
```

3. Submit the exact same invoice again.

### Expected Result

The first submission should be successful.

The second submission should be rejected because the invoice has already been submitted to the tax authority.

---
### Actual Result

The API accepted the duplicate submission.

### Root Cause

The endpoint did not check the current e-invoice status before submitting the invoice again.

### Fix

Added a check for invoices whose status is already:
- `submitted`
- `accepted`

Duplicate submissions now return `HTTP 409`.

Example response:
```json
{
  "error": "Invoice already submitted to tax authority"
}
```

---
Total bugs identified: `7/7`
Total bugs fixed: `7/7`
Automated tests: `34/34` passing