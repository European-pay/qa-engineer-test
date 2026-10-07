# Test Plan

## 1. Objective

The objective of this test plan is to verify the functionality, reliability, security, and validation behavior of the EU Pay payment API.

The testing focuses on:

- Authentication
- Payment processing
- Webhook security and idempotency
- Table order management
- E-invoice submission
- Input validation
- Duplicate request handling
- Authorization
- Negative and edge cases

---

## 2. Scope

### In Scope

The following API areas are covered:

- User registration
- User login
- JWT authentication
- Payment creation
- Payment retrieval
- Payment amount validation
- Currency validation
- Customer email validation
- Webhook signature verification
- Webhook idempotency
- Table order creation
- Duplicate table order prevention
- Table order status updates
- E-invoice submission
- Duplicate e-invoice prevention

### Out of Scope

The following areas are not deeply tested:

- Production payment gateway integration
- Real tax authority integration
- Real email delivery
- Production database performance
- Infrastructure and deployment configuration
- Third-party service availability

---

## 3. Test Strategy

Testing was performed using a combination of:

1. Manual API testing
2. Negative testing
3. Security testing
4. Edge-case testing
5. Integration testing
6. Automated API testing

Manual testing was initially used to identify the intentional bugs.

Automated tests were then added to prevent regressions after the fixes were implemented.

---

## 4. Test Environment

### Runtime

- Node.js 22.23.3
- npm 10.9.9

### Application

- Node.js
- Express.js
- SQLite/in-memory test database
- JWT authentication
- Socket.IO

### Testing Tools

- PowerShell
- `curl.exe`
- Supertest
- Node.js built-in test runner

### Application URL

```text
http://localhost:3000
```

---

## 5. Functional Testing

### Authentication

| Test Scenario | Expected Result |
|---|---|
| Register with valid details | User is registered |
| Register with invalid email | Request is rejected |
| Register with short password | Request is rejected |
| Register without business name | Request is rejected |
| Register duplicate email | Request is rejected |
| Login with valid credentials | JWT token returned |
| Login with incorrect password | Request is rejected |
| Login with unknown user | Request is rejected |
| Login without credentials | Request is rejected |

### Payments

| Test Scenario | Expected Result |
|---|---|
| Create valid payment | Payment created |
| Retrieve payments | Payments returned |
| Retrieve payment by ID | Payment returned |
| Negative amount | Request rejected |
| Zero amount | Request rejected |
| Amount above €50,000 | Request rejected |
| Invalid currency | Request rejected |
| Invalid customer email | Request rejected |
| Unauthenticated payment creation | Request rejected |
| Unauthenticated payment retrieval | Request rejected |
| Payment amount response type | Amount returned as number |

### Webhooks

| Test Scenario | Expected Result |
|---|---|
| Valid webhook signature | Webhook processed |
| Invalid webhook signature | Request rejected |
| Missing signature | Request rejected |
| Missing event ID | Request rejected |
| Duplicate webhook event | Event not processed again |

### Table Orders

| Test Scenario | Expected Result |
|---|---|
| Create valid table order | Order created |
| Create duplicate pending order | Request rejected |
| Create order after previous order is served | New order allowed |
| Create order without items | Request rejected |

### E-Invoices

| Test Scenario | Expected Result |
|---|---|
| Submit valid e-invoice | Invoice submitted |
| Submit duplicate e-invoice | Request rejected |
| Invalid customer SIRET | Request rejected |
| Missing invoice ID | Request rejected |
| Unauthenticated submission | Request rejected |

---

## 6. Negative Testing

Negative testing was used to verify that invalid input and invalid requests are rejected correctly.

Examples include:

- Negative payment amounts
- Zero payment amounts
- Excessively large payment amounts
- Invalid currencies
- Invalid email addresses
- Missing required fields
- Missing authentication
- Invalid JWT authentication
- Invalid webhook signatures
- Missing webhook signatures
- Missing webhook event IDs
- Duplicate webhook events
- Duplicate table orders
- Duplicate e-invoice submissions
- Invalid customer SIRET values

---

## 7. Security Testing

Security-focused testing was performed for important API entry points.

### Authentication

Verified that protected endpoints reject requests without a valid JWT token.

### Webhook Signature Verification

Tested forged webhook requests using an invalid signature.

Expected behavior:
`HTTP 401 Unauthorized`

### Input Validation

Tested invalid and boundary values for payment amounts, email addresses, currencies, and required fields.

### Duplicate Request Protection

Verified that repeated webhook events, table orders, and e-invoice submissions cannot be processed incorrectly.

### Additional Security Areas

The API should also be considered for further testing against:

- SQL injection
- XSS payloads
- JWT manipulation
- Authorization/IDOR issues
- Request replay attacks
- Rate limiting
- Brute-force login attempts

---

## 8. Edge-Case Testing

The following edge cases were considered:

- Payment amount equal to zero
- Negative payment amount
- Payment amount exactly at the €50,000 limit
- Payment amount above €50,000
- Invalid email formats
- Missing request fields
- Duplicate requests
- Repeated webhook events
- Repeated invoice submissions
- Orders for the same table
- Orders after a previous order is completed

---

## 9. Integration Testing

Integration testing verifies that multiple components work together correctly.

Examples:

### Authentication → Payment

1. Register merchant.
2. Obtain JWT.
3. Use JWT to create a payment.
4. Retrieve the created payment.

### Payment → Webhook

1. Create payment.
2. Generate valid webhook signature.
3. Submit payment status webhook.
4. Verify payment status update.
5. Submit the same webhook again.
6. Verify idempotent behavior.

### Table Order → Status Update

1. Create table order.
2. Obtain authenticated session.
3. Update order status.
4. Create another order for the same table.
5. Verify the new order is allowed after the previous order is no longer pending.

### E-Invoice → Duplicate Prevention

1. Authenticate merchant.
2. Submit an e-invoice.
3. Submit the same invoice again.
4. Verify the duplicate submission is rejected.

---

## 10. Automated Testing

Automated tests were implemented using:

- Node.js built-in test runner
- Supertest
- Node.js assert
- Crypto/HMAC utilities for webhook testing

The automated test suite currently contains:

`34` tests
`34` passed
`0` failed

### Test Distribution

| Test Area | Tests |
|---|---:|
| Authentication | 10 |
| E-Invoice | 5 |
| Payments | 10 |
| Table Orders | 4 |
| Webhooks | 5 |
| **Total** | **34** |

---

## 11. Regression Testing

After implementing the fixes, the complete automated test suite was executed using:

```text
npm test
```

Result:

`34` tests
`34` passed
`0` failed

This confirms that the implemented fixes did not break the tested functionality.

---

## 12. Exit Criteria

Testing can be considered complete when:

- All critical bugs are identified and fixed.
- At least 5 of the 7 intentional bugs are identified.
- All 7 identified bugs are fixed.
- Automated tests pass.
- No known critical regression remains in the tested functionality.
- Bug reports are documented.
- Fixes are documented.
- Test strategy and scenarios are documented.
- The application starts successfully.

Current status:

Bugs identified: `7/7`
Bugs fixed: `7/7`
Automated tests: `34/34` passing

---

## 13. Final Test Assessment

The implemented test coverage provides functional, negative, security-focused, edge-case, and integration coverage for the main API functionality.

The seven intentional bugs were identified through actual API testing and subsequently fixed and covered with automated regression tests.