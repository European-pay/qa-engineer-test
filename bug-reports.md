# Bug Report

## Bug A: Email Validation Allows Invalid Email Addresses

**Location:** `src/routes/auth.routes.js` (around line 9)  
**Severity:** Medium  
**Component:** Authentication

### What happens

The registration endpoint accepts email addresses that don't have a valid domain/TLD. For example, `user@domain` is accepted even though it is not a properly formatted email address for normal application use.

### Steps to reproduce

1. Start the server with `npm start`.
2. Send a `POST /api/auth/register` request with:
   ```json
   {
     "email": "user@domain",
     "password": "securepassword123",
     "business_name": "Test Business"
   }
   ```
3. Check the response.

### Expected

The API should reject the request with `400 Bad Request` and return an error explaining that the email format is invalid.

### Actual

The registration succeeds with `201 Created`, even though the email is missing a domain extension such as `.com` or `.org`.

### Why this matters

This can lead to invalid email addresses being stored in the system, which may cause problems with password resets, billing notifications, and other email-based communication.

### Likely cause

The current regex:

```javascript
/^[^\s@]+@[^\s@]+$/
```

only checks that there is an `@` with non-whitespace characters around it. It doesn't require a domain extension.

### Suggested fix

Use a stricter validation pattern:

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

---

## Bug B: Payment Amount Is Returned as a String

**Location:** `src/routes/payment.routes.js` (around line 15)  
**Severity:** Medium  
**Component:** Payment API

### What happens

The payment API returns the `amount` field as a string instead of a number. For example, the API returns `"100.00"` instead of `100.00`.

### Steps to reproduce

1. Start the server with `npm start`.
2. Login using `POST /api/auth/login` and get a JWT token.
3. Call `GET /api/payments` with the token in the `Authorization` header.
4. Check the `amount` field in the response.

### Expected

`amount` should be returned as a numeric value so the frontend can directly perform calculations, comparisons, and sorting.

### Actual

The API returns the amount as a string.

For example:

```json
{
  "amount": "100.00"
}
```

instead of:

```json
{
  "amount": 100.00
}
```

### Why this matters

Frontend code, financial calculations, sorting, or chart components may need to explicitly convert the value before using it. This can lead to type-related bugs or incorrect calculations if the conversion is missed.

### Likely cause

The response mapping explicitly converts the amount to a string:

```javascript
amount: p.amount.toString()
```

### Suggested fix

Keep the original numeric value:

```javascript
amount: p.amount
```

---

## Bug C: No Maximum Transaction Amount Validation

**Location:** `src/routes/payment.routes.js` (around line 60)  
**Severity:** High  
**Component:** Payment API

### What happens

The payment endpoint checks that the transaction amount is greater than zero, but there is no upper limit. This means extremely large payment amounts can be submitted successfully.

### Steps to reproduce

1. Start the server with `npm start`.
2. Login using `POST /api/auth/login` and get a JWT token.
3. Send a `POST /api/payments` request with:
   ```json
   {
     "amount": 999999999,
     "currency": "EUR",
     "customer_email": "test@example.com"
   }
   ```
4. Include the JWT token in the `Authorization` header.
5. Check the response.

### Expected

The API should reject an amount above the configured transaction limit with `400 Bad Request`.

### Actual

The payment is successfully created with `201 Created`, even with an extremely large amount.

### Why this matters

Without an upper limit, an accidental or malicious request could create an unrealistic transaction amount. Depending on how payments are processed downstream, this could also result in financial, validation, or overflow-related issues.

### Likely cause

The current validation only checks the lower boundary:

```javascript
amount <= 0
```

There is no maximum amount check.

### Suggested fix

Add a maximum transaction limit. For example:

```javascript
if (amount > 50000) {
  return res.status(400).json({
    error: 'Amount exceeds maximum transaction limit'
  });
}
```

The actual limit should ideally come from the application's business requirements/configuration rather than being hard-coded.

---

## Bug D: Duplicate E-Invoice Submissions Are Allowed

**Location:** `src/routes/einvoice.routes.js` (around line 45)  
**Severity:** Medium  
**Component:** E-Invoice

### What happens

The same e-invoice can be submitted multiple times. The second request is processed again instead of being rejected as a duplicate.

### Steps to reproduce

1. Start the server with `npm start`.
2. Login using `POST /api/auth/login` and get a JWT token.
3. Send a `POST /api/einvoice/submit` request with:
   ```json
   {
     "invoice_id": "inv_123",
     "customer_siret": "12345678901234"
   }
   ```
4. Send the exact same request again.
5. Check the second response.

### Expected

The second submission should be rejected with `409 Conflict`, indicating that the invoice has already been submitted.

### Actual

The second request is processed successfully with `200 OK`. The submission ID and timestamp can be overwritten with new values.

### Why this matters

For an e-invoicing/tax-compliance workflow, duplicate submissions can create inconsistent records and potentially cause issues with downstream tax authority processing or reconciliation.

### Likely cause

The route doesn't check whether the invoice has already reached a submitted or accepted state before creating another submission.

### Suggested fix

Check the invoice status before generating a new submission ID:

```javascript
if (
  invoice.einvoice_status === 'submitted' ||
  invoice.einvoice_status === 'accepted'
) {
  return res.status(409).json({
    error: 'Invoice already submitted to tax authority'
  });
}
```

---

## Bug E: Duplicate Pending Table Orders Are Allowed

**Location:** `src/routes/table-order.routes.js` (around line 30)  
**Severity:** Medium  
**Component:** Table Orders

### What happens

The API allows multiple pending orders to be created for the same table while the first order is still active.

### Steps to reproduce

1. Start the server with `npm start`.
2. Send a `POST /api/table-orders` request:
   ```json
   {
     "merchant_id": "merch_uuid",
     "table_number": 5,
     "items": [
       {
         "name": "Coffee",
         "price": 3.5,
         "quantity": 1
       }
     ]
   }
   ```
3. Send the exact same request again while the first order is still pending.
4. Check the response.

### Expected

The second request should be rejected with `409 Conflict`, indicating that the table already has an active/pending order.

### Actual

A second pending order is created successfully with `201 Created`.

### Why this matters

This can create duplicate orders for the same table, potentially causing confusion in the kitchen, duplicate billing, and inventory inconsistencies.

### Likely cause

The route creates the new order without first checking whether an active/pending order already exists for the same merchant and table.

### Suggested fix

After validating the order items, check for an existing pending order:

```javascript
const existingOrder = (db.table_orders || []).find(
  o =>
    o.merchant_id === merchant_id &&
    o.table_number === table_number &&
    o.status === 'pending'
);

if (existingOrder) {
  return res.status(409).json({
    error: 'Table already has a pending order'
  });
}
```

---

## Summary

| Bug | Area | Severity | Main Issue |
|---|---|---|---|
| A | Authentication | Medium | Invalid email formats are accepted |
| B | Payments | Medium | `amount` is returned as a string |
| C | Payments | High | No maximum transaction limit |
| D | E-Invoice | Medium | Duplicate invoice submissions are allowed |
| E | Table Orders | Medium | Duplicate pending orders are allowed |

**Priority:** Bug C should be addressed first because it involves transaction validation and has the highest potential impact. The remaining issues can then be handled as part of API validation and data consistency improvements.