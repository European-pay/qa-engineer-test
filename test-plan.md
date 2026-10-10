# Webhook Payment Flow Test Plan

## 1. Scope

Test payment-provider webhook receipt, signature validation, event deduplication, payment lookup, status update, and response behavior end to end. This plan covers API-level security and correctness. It excludes the UI, load/performance testing, production infrastructure, and real provider certification.

## 2. Environment

- API: `http://localhost:3000` (`PORT` can select another local port)
- Webhook simulator: curl, Postman, or HTTP integration tests
- Database: in-memory data; it resets when the process restarts
- Signature: HMAC-SHA256 using `WEBHOOK_SECRET`; the local default is `test-webhook-secret-key`
- Seed payment: ID `1`; seeded merchant credentials are `merchant@test.com` / `Test123!`

The signature is computed over the exact raw JSON request bytes. Generate it over precisely the bytes sent; whitespace or property-order changes therefore require a new signature. Real provider integrations must follow the provider's documented signing format.

## 3. Test Scenarios

| # | Scenario | Expected result |
|---|---|---|
| 1 | Valid signature, existing payment, supported status | HTTP 200; payment status updated |
| 2 | Missing signature | HTTP 401; payment unchanged |
| 3 | Incorrect signature | HTTP 401; payment unchanged |
| 4 | Same valid event ID delivered twice | Both acknowledged; update applied once |
| 5 | Valid signature for unknown payment ID | HTTP 404; event is not marked processed |
| 6 | Event arrives before its payment exists, then is retried after creation | First returns 404; retry can process successfully |
| 7 | Two distinct event IDs for one payment with sequential statuses | Each valid event processes; final state matches the later event |
| 8 | Missing `payment_id`, `status`, or `event_id` | HTTP 400; no payment mutation |
| 9 | Malformed JSON body | HTTP 400 from JSON parser; no route-side mutation |
| 10 | Two concurrent deliveries of the same event ID | Exactly one logical state transition; duplicate is acknowledged |
| 11 | SQL injection string in `payment_id` | Treated as an ordinary unmatched ID; HTTP 404 and no query execution |
| 12 | Signature comparison with wrong digest bytes | HTTP 401; no distinguishable partial-match behavior |
| 13 | Replayed old event ID | Acknowledged as already processed; no state change |
| 14 | Unsupported status or markup in status field | HTTP 400; no untrusted value stored |
| 15 | Very large payment ID | HTTP 404; no crash or unbounded work |
| 16 | Unicode or null/empty event ID | Empty ID rejected; Unicode status rejected unless explicitly supported |
| 17 | Future/old timestamp field | No timestamp semantics are currently implemented; document and reject/handle according to provider policy before production |

## 4. Security Checks

- Confirm HMAC-SHA256 verification uses the configured secret and a timing-safe digest comparison.
- Verify invalid signatures never mutate data and are not recorded as processed.
- Retry a processed event ID and confirm idempotent acknowledgment.
- Submit SQL-like values in identifiers and confirm they remain data, not executable query text.
- Submit HTML/script markup as status and confirm status allow-list validation rejects it.
- Check timestamp freshness and provider replay windows. The demo does not include a signed timestamp policy; define and implement one before production if the provider supports it.

## 5. Edge Cases

- Very large and unknown payment IDs
- Unicode, empty, null, and whitespace-only event IDs
- Unknown, empty, and markup status values
- Future timestamps and stale timestamps
- Amount/payment already in terminal state, where relevant to allowed transitions
- Duplicate ID after a process restart, documenting that in-memory storage loses deduplication history

## 6. Integration Checks

- Webhook request updates the matching payment and the changed state is visible on `GET /api/payments/:id`.
- Invalid signature leaves the payment unchanged.
- Duplicate delivery leaves a single processed-event record and does not reapply side effects.
- Socket.IO emission is currently not implemented for payment webhooks; if added, assert one event on the merchant room for the first delivery and none for retries.
- Retry behavior depends on provider policy. Return 4xx for invalid/unprocessable events and define 5xx behavior for transient persistence failures; the demo has no durable retry queue.

## 7. Risk Assessment

Forged or replayed webhooks can create incorrect payment state and financial reconciliation errors. Detect issues with signature failure metrics, duplicate-event logs, status transition alerts, and reconciliation against the payment provider. Mitigate with managed secrets, raw-body signature verification, timestamp/replay windows, durable unique event IDs, atomic persistence, strict status transitions, least-privilege webhook handling, and periodic provider reconciliation. The current in-memory demo cannot provide durable or cross-instance idempotency.

## Execution Record

The local API was manually checked with curl for a valid signed webhook and a repeated event ID. The accepted event returned `new_status: completed`; the repeated delivery returned `Already processed`. The 15 automated HTTP integration tests cover missing and invalid signatures, missing fields, unknown payments, invalid statuses, raw-body signing, and duplicate events; run them with `npm test`. Concurrency, timestamp freshness, SQL injection payloads, and load behavior remain planned scenarios; they were not run as part of the manual checks.

Additional manual checks confirmed numeric payment amounts, rejection of an amount above €50,000, rejection of `user@domain`, duplicate pending table-order rejection, and duplicate e-invoice submission rejection. `npm test` passed all 15 tests, and `npm run verify-bugs` passed all seven checks.
