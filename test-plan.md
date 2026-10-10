# Webhook Payment Flow Test Plan

## 1. Test Scope

This plan covers the payment webhook endpoint from signed request through payment status mutation and idempotent retry handling. It includes validation, authentication boundaries, integrity, replay resistance, and database effects.

Out of scope: UI behavior, performance/load testing, production network infrastructure, and an external tax authority.

## 2. Test Environment

- API: `localhost:3000` when manually exercising the service; automated tests import the Express app directly.
- Webhook simulator: curl, Postman, or `supertest`.
- Database: in-memory database; reset between automated tests.
- Signature: HMAC-SHA256 using the configured test webhook secret.

## 3. Test Scenarios

| ID | Scenario | Expected result |
| --- | --- | --- |
| WH-01 | Valid webhook with correct signature | `200`; payment status is updated once. |
| WH-02 | Webhook with invalid signature | `401`; payment is unchanged. |
| WH-03 | Duplicate webhook with the same `event_id` | `200` already-processed response; no second mutation. |
| WH-04 | Webhook for a non-existent payment | `404`; event is not recorded as processed. |
| WH-05 | Webhook arrives before payment creation | `404`; a later valid event can be retried after payment creation. |
| WH-06 | Multiple webhooks for one payment with different event IDs | Each valid event is accepted in order and final status matches the last event. |
| WH-07 | Webhook missing `payment_id`, `status`, or `event_id` | `400`; no payment mutation. |
| WH-08 | Malformed JSON body | Express returns a client error; no route handler mutation occurs. |
| WH-09 | Concurrent webhooks | Duplicate event IDs result in one effective processing operation; distinct IDs follow defined ordering. |
| WH-10 | SQL injection string in `payment_id` | No query execution or mutation; `404` for the unknown identifier. |
| WH-11 | Signature timing-attack resistance | Comparison uses a constant-time equality operation and rejects invalid signatures. |
| WH-12 | Replay of an old event ID | Already-processed response; original payment state is preserved. |

## 4. Security Tests

- Verify HMAC-SHA256 with the exact request body and shared secret.
- Reject missing, malformed, and incorrect signatures before looking up or changing a payment.
- Verify replay protection using a previously processed `event_id`.
- Send SQL-injection-like identifiers and confirm they are treated as data.
- Send HTML/script text in `status`; verify the API does not execute it and confirm the accepted status policy before production deployment.

## 5. Edge Cases

- Very large `payment_id` values.
- Unicode status values and unsupported status values.
- Null, empty, and repeated `event_id` values.
- Future timestamps if timestamps are added to the payload.
- Whitespace or uppercase variants of the signature header.

## 6. Integration Tests

- Webhook -> payment status update -> database persistence.
- Webhook -> Socket.IO event emission, once the event emission is enabled in the route.
- Failed webhook -> client retry with the same event ID; successful retry is processed once.

## 7. Risk Assessment

Forged signatures could change financial state, and duplicate deliveries could create inconsistent downstream records. Detect failures with structured webhook logs, event IDs, status-transition metrics, and alerts for repeated signature failures. Mitigate with secret rotation, constant-time signature comparison, idempotency storage with a uniqueness constraint in a persistent database, and explicit status-transition rules.
