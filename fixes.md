# Fixes

## Bug A — Payment Amount Returned as String

**File:** `src/routes/payment.routes.js`

### Problem

The API converted the payment amount to a string before returning it in the response.

### Original Code

```js
amount: p.amount.toString()

and:
amount: payment.amount.toString()
```

### Fix

Removed the `.toString()` conversion.

The API now returns the numeric database value directly.

### Verification
Created a payment with an amount of `25.50` and called:
`GET /api/payments`

The response now returns:
```json
{
  "amount": 25.5
}
```

The automated test also verifies that the returned amount has type number.

---
## Bug B — No Maximum Payment Amount Validation

**File:** `src/routes/payment.routes.js`

### Problem

The API accepted payment amounts greater than the maximum allowed amount of `€50,000`.

### Fix

Added a maximum amount validation after the existing positive amount validation:
```t
if (amount > 50000) {
  return res.status(400).json({
    error: 'Payment amount cannot exceed €50,000'
  });
}
```

### Verification
Submitted a payment with:
```json
{
  "amount": 999999999,
  "currency": "EUR",
  "customer_email": "customer@example.com"
}
```

The API now rejects the request with HTTP 400.

### Automated test:

`POST /payments` rejects amount above `50000 EUR`

---
## Bug C — Invalid Email Format Accepted

**File:** `src/routes/auth.routes.js`

### Problem

The registration API accepted emails such as:
`user@domain`

because the previous validation did not require a domain extension.

### Fix
Updated the email validation regex to:
`const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;`

### Verification

The following email is now rejected:
`user@domain`

with an invalid email format response.

Automated tests verify rejection of:
- Email without a TLD
- Email without an @ symbol

---
## Bug D — Webhook Signature Not Verified

**File:** `src/routes/webhook.routes.js`

### Problem

The webhook endpoint accepted requests containing forged signatures.

### Fix

Implemented `HMAC-SHA256` signature verification using the webhook secret.

The expected signature is generated from the request body:
```t
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
```

The supplied signature is then compared with the expected signature.

Invalid signatures are rejected with `HTTP 401`.

### Verification

Tested the webhook using:
`x-webhook-signature: fake-signature`

The API returned `HTTP 401`.

A correctly generated HMAC signature was accepted successfully.

Automated tests verify:
- Invalid signature rejection
- Valid signature processing
- Missing signature rejection

---
## Bug E — Duplicate Webhook Events Accepted

**File:** `src/routes/webhook.routes.js`

### Problem

The same webhook event could be processed multiple times.

### Fix

Added an `event_id` requirement and an idempotency check.

The endpoint now checks whether the event ID has already been processed:
```t
if (db.processed_webhooks.includes(event_id)) {
  return res.status(200).json({
    success: true,
    message: 'Already processed'
  });
}
```

After successful processing, the event ID is stored:
```t
db.processed_webhooks.push(event_id);
```

### Verification

Sent the same webhook event twice using the same `event_id`.

First request:
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

Second request:
```json
{
  "success": true,
  "message": "Already processed"
}
```

The automated test also verifies that the event ID is stored only once.

---
## Bug F — Duplicate Pending Table Orders Allowed

**File:** `src/routes/table-order.routes.js`

### Problem

Multiple pending orders could be created for the same merchant and table.

### Fix

Added a check for an existing pending order:
```t
const existingOrder = (db.table_orders || []).find(
  o => o.merchant_id === merchant_id &&
       o.table_number === table_number &&
       o.status === 'pending'
);
```

If a pending order already exists, the API returns `HTTP 409`:
```t
return res.status(409).json({
  error: 'Table already has a pending order'
});
```

### Verification

Created a pending order for a table and submitted another order for the same table.

The second request now returns `HTTP 409`.

Also verified that a new order can be created after the existing order changes from pending to served.

---
## Bug G — Duplicate E-Invoice Submission Allowed

**File:** `src/routes/einvoice.routes.js`

### Problem

The same invoice could be submitted multiple times.

### Fix

Added a status check before submitting an e-invoice:
```t
if (
  invoice.einvoice_status === 'submitted' ||
  invoice.einvoice_status === 'accepted'
) {
  return res.status(409).json({
    error: 'Invoice already submitted to tax authority'
  });
}
```

### Verification

Submitted the same invoice twice.

The first submission succeeded.

The second submission returned `HTTP 409`:
```json
{
  "error": "Invoice already submitted to tax authority"
}
```

The automated test verifies that duplicate submissions are rejected.

Test Results
`34` tests
`34` passed
`0` failed

All automated tests are currently passing.