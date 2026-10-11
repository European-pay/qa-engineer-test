Here is a concise, human-like test plan tailored for your webhook system:

---

### 1. Test Scope

- **In Scope:** Payment webhook end-to-end flow, HMAC signature verification, idempotency, and database status updates.
- **Out of Scope:** Frontend UI, performance/load testing, and external PSP network latency.

### 2. Test Environment

- **API URL:** `http://localhost:3000`
- **Client Tool:** Postman / curl
- **Database:** In-memory mock DB (resets on server restart)

### 3. Test Scenarios (12 Key Checks)

1. Valid webhook with correct signature (`200 OK`)
2. Webhook with invalid HMAC signature (`401 Unauthorized`)
3. Duplicate webhook with same `event_id` (`200 OK` + idempotent skip)
4. Webhook for a non-existent payment ID (`404 Not Found`)
5. Webhook arriving before payment record is created (`404` or queue state)
6. Multiple sequential status transitions (pending → processing → completed)
7. Webhook payload missing mandatory fields (`400 Bad Request`)
8. Webhook sent with malformed JSON body (`400 Bad Request`)
9. Concurrent webhooks for the same transaction (race condition check)
10. Webhook payload containing SQL injection strings in `payment_id`
11. Signature timing attack verification (constant-time comparison)
12. Replay attack test using stale or expired `event_id` timestamps

### 4. Security Tests

- **Signatures:** Verify HMAC-SHA256 headers match expected secret keys.
- **Replay Protection:** Ensure unique `event_id` tracking rejects old payloads.
- **Injection/Sanitization:** Validate input strings against SQLi and XSS payloads in status parameters.

### 5. Edge Cases

- Extremely long or max-length `payment_id` strings.
- Unicode/special characters passed inside status fields.
- Null, undefined, or empty `event_id` values.
- Timestamps set far in the future.

### 6. Integration Tests

- Webhook trigger → Payment status updates in DB → Verified via `GET /api/payments/:id`.
- Webhook trigger → Socket.IO room broadcast emission (`order_status_changed` / payment events).
- Failed webhook handling & simulated retry behavior.

### 7. Risk Assessment

- **Risk:** Webhook spoofing or replay attacks draining merchant balances.
- **Detection:** Spike in `401 Unauthorized` signature failures or logs showing duplicate event IDs.
- **Mitigation:** Enforce strict HMAC-SHA256 signature headers and robust idempotency caching.
