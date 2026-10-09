# EU Pay QA — Bug Reports

## Bug A — Payment amount returned as a string
Severity: Medium
Expected: The API returns the payment amount as a number.
Fix: Return numeric amounts.

## Bug B — Maximum payment amount not enforced
Severity: High
Expected: Reject amounts greater than 50,000 and non-positive or non-finite amounts.
Fix: Validate the payment amount before processing.

## Bug C — Invalid email accepted
Severity: Medium
Example: user@domain
Expected: Reject emails without a domain suffix.
Fix: Validate the email format.

## Bug D — Webhook signature not verified
Severity: Critical
Expected: Reject missing or invalid webhook signatures.
Fix: Verify the HMAC-SHA256 signature before processing.

## Bug E — Duplicate webhook events
Severity: High
Expected: Process each event only once.
Fix: Track processed event IDs.

## Bug F — Duplicate pending table orders
Severity: Medium
Expected: Reject a second pending order for the same merchant and table.
Fix: Return HTTP 409 for duplicate pending orders.

## Bug G — Duplicate e-invoice submissions
Severity: Medium
Expected: Reject invoices already submitted or accepted.
Fix: Return HTTP 409 for duplicate submissions.
