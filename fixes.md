# EU Pay Fixes

## Fix A: Numeric payment amounts

`src/routes/payment.routes.js` now maps list and detail responses with `Number(...)` and stores validated creation amounts as numbers. This keeps the existing response shape while making arithmetic safe for API consumers.

## Fix B: EUR 50,000 upper boundary

Payment creation converts the input once, rejects non-finite and non-positive values, then rejects values above `50000`. Exactly `50000` remains accepted.

## Fix C: Email validation

Registration now requires a non-empty local part, an `@`, and a dot-separated domain suffix. Duplicate-email and password validation behavior is unchanged.

## Fix D: Secure webhook signatures

Payment-status webhooks calculate an HMAC-SHA256 digest from the parsed request body and compare it with the supplied header using `crypto.timingSafeEqual`. Missing, malformed, or incorrect signatures receive `401` before payment lookup or mutation.

## Fix E: Webhook idempotency

Webhook requests require an `event_id`. Successfully processed event IDs are stored in `db.processed_webhooks`; a repeated ID returns a successful already-processed response without changing payment state.

## Fix F: Pending table-order duplicates

A new order is rejected with `409` when the same merchant and table already have a pending order. Orders are allowed again after the earlier order is cancelled or otherwise leaves the pending state.

## Fix G: Duplicate e-invoice submissions

The submit route now rejects invoices whose `einvoice_status` is already `submitted` or `accepted`, preserving the original submission ID and returning `409`.

## Testability improvement

`src/server.js` only listens when executed directly, so tests can import the Express app without requiring a manually running server. `resetDatabase()` restores seeded in-memory data between tests, and the test script runs files serially to avoid shared-state races.
