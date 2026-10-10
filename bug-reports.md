# EU Pay Bug Reports

The following findings were reproduced against the original implementation before the fixes in this submission.

## Bug A: Payment amounts returned as strings

**Location:** `src/routes/payment.routes.js`

**Severity:** Medium
**Component:** Payment API

**How to Reproduce:** Authenticate and call `GET /api/payments` or `GET /api/payments/:id`.

**Expected Behavior:** `amount` is a JSON number so clients can calculate totals safely.

**Actual Behavior:** The response serialized the amount with `toString()`, returning values such as `"25.5"`.

**Impact:** Consumers must add conversion logic and can perform incorrect string concatenation.

**Root Cause:** Response mapping converted the stored numeric value to a string.

**Suggested Fix:** Preserve a numeric value with `Number(payment.amount)`.

## Bug B: Excessive payment amounts accepted

**Location:** `src/routes/payment.routes.js`

**Severity:** High
**Component:** Payment API

**How to Reproduce:** Send an authenticated `POST /api/payments` with `amount: 999999999`.

**Expected Behavior:** Amounts above EUR 50,000 are rejected; EUR 50,000 remains valid.

**Actual Behavior:** Only missing, non-numeric, zero, and negative values were rejected.

**Impact:** Invalid or fraudulent payment values could enter the payment workflow.

**Root Cause:** There was no upper-bound validation.

**Suggested Fix:** Reject numeric amounts greater than `50000` after numeric validation.

## Bug C: Registration accepts an email without a TLD

**Location:** `src/routes/auth.routes.js`

**Severity:** Medium
**Component:** Auth API

**How to Reproduce:** Register with `user@domain`.

**Expected Behavior:** Registration rejects an address without a dot-separated domain suffix.

**Actual Behavior:** The permissive regex accepted it.

**Impact:** Invalid customer or merchant contact data can be stored.

**Root Cause:** The regex checked `@` but not a domain suffix.

**Suggested Fix:** Require a non-whitespace dot-separated suffix after `@`.

## Bug D: Webhook signatures were not verified

**Location:** `src/routes/webhook.routes.js`

**Severity:** Critical
**Component:** Webhooks

**How to Reproduce:** POST a payment-status webhook with any or no `x-webhook-signature` header.

**Expected Behavior:** Only an HMAC-SHA256 signature generated with the shared secret is accepted.

**Actual Behavior:** The payload was processed without signature verification.

**Impact:** An attacker could forge payment status changes.

**Root Cause:** The HMAC calculation and comparison were commented out.

**Suggested Fix:** Compute the expected HMAC and compare equal-length buffers with `timingSafeEqual`.

## Bug E: Duplicate webhook events were processed twice

**Location:** `src/routes/webhook.routes.js`

**Severity:** High
**Component:** Webhooks

**How to Reproduce:** Send the same signed `event_id` twice with different statuses.

**Expected Behavior:** The second delivery is acknowledged without applying its mutation again.

**Actual Behavior:** Every delivery updated the payment.

**Impact:** Retries could produce inconsistent payment state or duplicate downstream effects.

**Root Cause:** `db.processed_webhooks` was never checked or populated.

**Suggested Fix:** Require `event_id`, check the processed collection, and record successful events.

## Bug F: Duplicate pending table orders were allowed

**Location:** `src/routes/table-order.routes.js`

**Severity:** Medium
**Component:** Table Orders

**How to Reproduce:** Submit two orders for the same merchant and table while the first is pending.

**Expected Behavior:** The second request returns `409 Conflict`.

**Actual Behavior:** Both requests created pending orders.

**Impact:** Staff and customers could see duplicate orders for one table.

**Root Cause:** The intended pending-order lookup was commented out.

**Suggested Fix:** Reject an existing pending order for the same merchant and table.

## Bug G: Duplicate e-invoice submissions were allowed

**Location:** `src/routes/einvoice.routes.js`

**Severity:** Medium
**Component:** E-Invoicing

**How to Reproduce:** Submit the same authenticated invoice twice with a valid SIRET.

**Expected Behavior:** The second submission returns `409 Conflict`.

**Actual Behavior:** A new tax-authority submission ID was generated each time.

**Impact:** The same invoice could be submitted more than once to the authority.

**Root Cause:** Existing `submitted` and `accepted` states were not checked.

**Suggested Fix:** Reject invoices already in either terminal submission state.
