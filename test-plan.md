# EU Pay QA — Webhook Test Plan

Endpoint: POST /api/webhooks/payment-status

| ID | Scenario | Expected result |
|---|---|---|
| WH-01 | Valid signature and valid payload | Request processed |
| WH-02 | Missing signature | Rejected |
| WH-03 | Invalid signature | Rejected |
| WH-04 | Payload changed after signing | Signature validation fails |
| WH-05 | Missing event ID | Invalid payload rejected |
| WH-06 | Missing payment ID | Invalid payload rejected |
| WH-07 | Missing status | Invalid payload rejected |
| WH-08 | Unsupported status | Invalid payload rejected |
| WH-09 | Unknown payment ID | No payment update |
| WH-10 | Duplicate event ID | No duplicate processing |
| WH-11 | Different event IDs | Each event evaluated |
| WH-12 | Valid payment status update | Supported status applied |
| WH-13 | Malformed signature value | Request rejected |
| WH-14 | Replay after server restart | Verify persistence of idempotency |
| WH-15 | Concurrent duplicate deliveries | Only one effective processing operation |
| WH-16 | Same event ID with altered body | Duplicate is not processed again |

## Execution notes
The automated regression suite currently covers missing signatures, invalid signatures, and processing a valid event only once. Other scenarios above are planned and must be executed before being reported as passed.

Use test data and the configured test secret only. Record request, response, and resulting database state for each executed scenario.
