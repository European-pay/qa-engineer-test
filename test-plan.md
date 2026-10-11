# Test Plan

## Scope
Validate payment API behavior, authentication, webhook security and idempotency, table-order duplicate prevention, and e-invoice submission rules.

## Environment
- Node.js
- npm dependencies from package.json
- Automated HTTP tests using Node's built-in test runner and Supertest
- Test database initialized and reset by the test setup

## Automated Test Coverage
The automated suite covers:
- Authentication and login validation
- Payment list and detail response types
- Valid and invalid payment amounts
- Payment maximum-amount validation
- Webhook signature verification
- Webhook duplicate-event handling
- Table-order creation and duplicate prevention
- E-invoice submission and duplicate prevention

Run with:
`npm test`

## Payment Boundary Cases
1. Submit a valid positive amount.
2. Submit zero and a negative amount.
3. Submit a non-numeric amount.
4. Submit €5,000.
5. Submit €50,000.
6. Submit an amount greater than €50,000.
7. Verify that returned payment amounts are JSON numbers.
8. Submit an unsupported currency and a malformed email.

## Webhook Security and Reliability
1. Send a valid signed event for an existing payment.
2. Send an invalid signature and expect rejection.
3. Send the same event ID twice and verify the second request does not change the payment again.
4. Submit an event for an unknown payment.
5. Omit required fields or the event ID.
6. Replay an event after the server restarts to assess the limits of in-memory idempotency.
7. Test concurrent duplicate events against persistent storage before production use.

## Order and E-Invoice Cases
1. Create a valid table order.
2. Submit another pending order for the same merchant and table.
3. Verify that a different table can have its own pending order.
4. Submit an invoice with a valid customer SIRET.
5. Attempt to submit the same invoice again.
6. Attempt to submit another merchant's invoice.
7. Test missing or malformed invoice fields.

## Manual and Integration Checks
- Start the application with `npm start`.
- Exercise relevant endpoints using curl or an API client.
- Verify HTTP status codes and response bodies.
- Confirm the server starts without runtime errors.
- Check that production code does not leak secrets or unnecessary logs.

## Execution Record
Automated results should be recorded after running `npm test`. Manual and integration checks must be marked complete only after they have actually been executed.
