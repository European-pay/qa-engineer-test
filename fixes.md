# EU Pay QA — Fixes

- **A:** Return payment amounts as numbers.
- **B:** Validate finite, positive payment amounts and enforce the 50,000 maximum.
- **C:** Reject malformed email addresses without a fully qualified domain.
- **D:** Verify webhook HMAC-SHA256 signatures.
- **E:** Track processed webhook event IDs to prevent duplicate processing.
- **F:** Reject duplicate pending orders for the same merchant and table.
- **G:** Reject invoices already submitted or accepted.

## Future improvements
- Store webhook secrets in environment variables.
- Persist processed event IDs across server restarts.
- Make duplicate checks safe under concurrent requests.
- Add integration and concurrency tests.
