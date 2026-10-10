# Bug Reports

Findings below describe the behavior of the starter implementation before fixes. Reproduction requests use the seeded merchant (`merchant@test.com` / `Test123!`). For authenticated requests, log in first and use the returned token as `Authorization: Bearer <token>`. The final section records the checks run against the fixed API.

## Bug A: Payment amount serialized as a string

**Location:** `src/routes/payment.routes.js`, GET list and detail handlers  
**Severity:** Medium  
**Component:** Payment API

**How to reproduce:** Start the service, log in, then call `GET /api/payments` and `GET /api/payments/1` with the JWT.

**Expected:** `amount` is a JSON number for both endpoints.  
**Actual:** Both handlers called `.toString()`, so clients received values such as `"25.5"`.  
**Impact:** Clients doing numeric comparisons, totals, or schema validation can behave incorrectly.  
**Root cause:** The response serializers explicitly converted numeric amounts to strings.  
**Suggested fix:** Return a finite numeric value consistently; regression tests check list and detail responses.

## Bug B: Payments had no maximum amount

**Location:** `src/routes/payment.routes.js`, POST handler  
**Severity:** High  
**Component:** Payment API

**How to reproduce:** Log in and POST `/api/payments` with `{"amount":999999999,"currency":"EUR","customer_email":"buyer@example.com"}`.

**Expected:** Reject amounts above the configured €50,000 transaction limit with HTTP 400.  
**Actual:** The starter validated only that the amount was positive, so the request proceeded to create a payment.  
**Impact:** An unrealistic or unintended amount can enter payment processing.  
**Root cause:** There was no upper-bound check, and the old coercion allowed non-finite numeric inputs through some paths.  
**Suggested fix:** Require a finite positive number and enforce the documented maximum before creating the payment.

## Bug C: Registration accepted domain-only email addresses

**Location:** `src/routes/auth.routes.js`, `validateEmail`  
**Severity:** Medium  
**Component:** Auth API

**How to reproduce:** POST `/api/auth/register` with `{"email":"user@domain","password":"SecurePass123!","business_name":"Example Co"}`.

**Expected:** Reject an address without a domain suffix.  
**Actual:** The starter regular expression accepted any non-space text on both sides of `@`, including `user@domain`. Payment creation also used a weaker `includes('@')` check and accepted malformed addresses.  
**Impact:** Invalid contact addresses can be stored and prevent account communications.  
**Root cause:** Validation did not require a dot and a suffix after the domain.  
**Suggested fix:** Use one shared server-side format check that requires a non-empty suffix after a dot for registration and payments. This is a pragmatic check, not full RFC mailbox validation.

## Bug D: Payment webhook signatures were not checked

**Location:** `src/routes/webhook.routes.js`, POST `/payment-status`  
**Severity:** Critical  
**Component:** Webhooks

**How to reproduce:** POST `/api/webhooks/payment-status` with `{"payment_id":"1","status":"failed","event_id":"evt-spoof"}` and omit `x-webhook-signature` (or provide any fake value).

**Expected:** Reject the event unless the HMAC-SHA256 signature is valid.  
**Actual:** The starter ignored the header and changed the payment status.  
**Impact:** An unauthenticated caller could forge payment status changes.  
**Root cause:** Signature verification was present only as commented-out sample code.  
**Suggested fix:** Verify the configured HMAC secret and compare equal-length digest buffers with a timing-safe comparison before processing.

## Bug E: Repeated payment webhook events were applied repeatedly

**Location:** `src/routes/webhook.routes.js`, POST `/payment-status`  
**Severity:** High  
**Component:** Webhooks

**How to reproduce:** Sign a valid payload and POST it twice with the same `event_id`.

**Expected:** Process the event once; acknowledge retries without applying it again.  
**Actual:** The starter updated the payment on every delivery and did not record processed event IDs.  
**Impact:** Provider retries can repeat side effects and conflicting deliveries can overwrite newer state.  
**Root cause:** The database collection existed, but the deduplication check and insert were commented out.  
**Suggested fix:** Require an event ID and record it after successful processing. A persistent database should enforce uniqueness transactionally.

## Bug F: Pending orders could be duplicated for a table

**Location:** `src/routes/table-order.routes.js`, POST `/`  
**Severity:** Medium  
**Component:** Table Orders

**How to reproduce:** POST the same valid table order twice using the same `merchant_id` and `table_number` before changing the first order's status.

**Expected:** Reject the second pending order with HTTP 409.  
**Actual:** The starter created a second pending order.  
**Impact:** Staff can receive duplicate kitchen orders and merchants may charge twice.  
**Root cause:** No query checked for an existing pending order for the same merchant and table.  
**Suggested fix:** Check the current pending order before inserting and return a conflict. A production database should enforce this atomically.

## Bug G: An invoice could be submitted more than once

**Location:** `src/routes/einvoice.routes.js`, POST `/submit`  
**Severity:** Medium  
**Component:** E-Invoice

**How to reproduce:** Submit the same invoice ID twice with a valid 14-digit customer SIRET and the merchant JWT.

**Expected:** After a successful submission, reject subsequent submissions with HTTP 409.  
**Actual:** The starter generated a new submission ID and submitted the same invoice again.  
**Impact:** Duplicate tax-authority submissions can create inconsistent or non-compliant invoice records.  
**Root cause:** Existing submission state was not checked before creating another submission.  
**Suggested fix:** Reject invoices already submitted or accepted and persist submission state with an idempotency constraint in production.

## Verification After Fixes

The following API checks were run with curl against the local server:

| Bug | Request/check | Observed result |
|---|---|---|
| A | Login, then `GET /api/payments` | HTTP 200; amounts returned as JSON numbers (`25.5`, `100`) |
| B | Create payment for `999999` | HTTP 400; amount maximum error |
| C | Register `user@domain` | HTTP 400; `Invalid email format` |
| D | Post payment webhook with valid HMAC signature | HTTP 200; payment status updated |
| E | Retry the same signed event | HTTP 200; `Already processed` |
| F | Post same pending table order twice | First HTTP 201; second HTTP 409 |
| G | Submit same invoice twice | First HTTP 200; second HTTP 409 |

The initial buggy responses above are based on inspection of the supplied starter implementation; the requests in this table were run after the fixes.
