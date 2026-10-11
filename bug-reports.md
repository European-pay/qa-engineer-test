# Bug Reports

## Bug A: Payment amount returned as a string
- **Severity:** Medium
- **Impact:** Clients receive inconsistent data types and may handle amounts incorrectly.
- **Root cause:** The payment response converted numeric amounts to strings.
- **Fix:** Return the numeric amount without calling `.toString()`.
- **Verification:** Automated tests assert that payment amounts are numbers in both list and detail responses.

## Bug B: Incorrect maximum payment amount
- **Severity:** High
- **Impact:** Valid payments above €5,000 but at or below €50,000 were incorrectly rejected.
- **Expected:** Reject amounts greater than €50,000.
- **Root cause:** The validation used an incorrect limit and included a redundant maximum check.
- **Fix:** Validate positive numeric amounts and reject amounts above 50,000.
- **Verification:** Test the boundary at 5,000, 50,000, and just above 50,000.

## Bug C: Overly permissive email validation
- **Severity:** Medium
- **Impact:** Malformed email addresses such as `user@domain` could pass validation.
- **Root cause:** The original regular expression did not require a domain suffix.
- **Fix:** Use a stricter basic email-format regular expression.
- **Limitation:** Regex validation does not prove that an address exists or can receive email.

## Bug D: Missing webhook signature verification
- **Severity:** Critical
- **Impact:** An attacker could attempt to submit forged payment-status updates.
- **Root cause:** The webhook endpoint did not verify the request signature.
- **Fix:** Verify an HMAC-SHA256 signature before processing the event.
- **Verification:** Valid signatures are accepted and invalid signatures are rejected.

## Bug E: Duplicate webhook events
- **Severity:** High
- **Impact:** Replayed events could process the same payment update repeatedly.
- **Root cause:** Previously processed event IDs were not checked.
- **Fix:** Track processed event IDs and return an already-processed response for duplicates.
- **Limitation:** The current in-memory store does not guarantee idempotency across restarts or multiple server instances.

## Bug F: Duplicate pending table orders
- **Severity:** High
- **Impact:** Repeated requests could create multiple pending orders for the same merchant and table.
- **Root cause:** The endpoint did not check for an existing pending order.
- **Fix:** Check for a matching pending order and return HTTP 409 when one exists.

## Bug G: Duplicate e-invoice submissions
- **Severity:** High
- **Impact:** Repeated submission requests could create multiple submission attempts for the same invoice.
- **Root cause:** The endpoint did not prevent resubmission of invoices already submitted or accepted.
- **Fix:** Check the invoice submission status and reject duplicate submissions with HTTP 409.
