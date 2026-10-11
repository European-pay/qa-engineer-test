# Fixes and Implementation Notes

## Payment API
- Return payment amounts as numbers.
- Validate that amounts are positive and numeric.
- Enforce the maximum payment amount of €50,000.
- Validate supported currencies and email format.
- Add automated tests for valid requests, invalid amounts, and response data types.

## Authentication
- Tighten email-format validation to reject addresses without a domain suffix.
- Retain authentication middleware for protected endpoints.
- The current JWT secret is a test value and must be supplied securely through configuration in production.

## Webhooks
- Verify the HMAC-SHA256 signature before processing a webhook.
- Require an event ID.
- Track processed event IDs to prevent repeated processing.
- Test valid signatures, invalid signatures, new events, and duplicate events.

## Table Orders
- Validate required merchant, table, and item fields.
- Prevent a second pending order for the same merchant and table.
- Return HTTP 409 for a duplicate pending order.

## E-Invoices
- Validate the invoice ID and customer SIRET.
- Verify invoice ownership.
- Prevent resubmission when the invoice is already submitted or accepted.
- Return HTTP 409 for duplicate submissions.

## Testability
- Separate the Express application from server startup so route tests can run without opening the production listener.
- Add test setup to reset and initialize the in-memory database.
- Use Node's built-in test runner and Supertest for automated HTTP tests.

## Known Limitations
- Application data and processed webhook IDs are stored in memory and are lost on restart.
- The webhook secret and JWT secret are test values, not production-ready configuration.
- Webhook signature generation must match the payment provider's exact signing protocol. Production integrations may require verification against the raw request body and timing-safe comparison.
- Duplicate-order prevention should be enforced atomically in persistent storage to handle concurrent requests safely.
- E-invoice submission is simulated by the current application; a successful API response does not prove delivery to a real tax authority.
