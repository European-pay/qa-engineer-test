# Fixes

## Fix 1: Return numeric payment amounts

**Bug:** A  
**Files:** `src/routes/payment.routes.js`  
**Change:** Both list and detail serializers now return `Number(amount)` rather than calling `.toString()`.  
**Why:** JSON clients receive a number and can validate and calculate with the intended type.  
**Verification:** HTTP integration tests assert the type from both endpoints. A manual curl request to `GET /api/payments` returned HTTP 200 with numeric amounts `25.5` and `100`.

## Fix 2: Enforce payment amount bounds

**Bug:** B  
**Files:** `src/routes/payment.routes.js`  
**Change:** Accept only finite numbers or numeric strings; reject empty, non-numeric, boolean, zero, negative, and above-€50,000 values. Normalize valid input once before storage.  
**Why:** Prevents unrealistic values and numeric coercion edge cases.  
**Verification:** HTTP tests accept exactly 50,000 and reject zero, negative, non-numeric, empty, and above-limit values. A manual POST with `999999` returned HTTP 400 and the maximum-amount error.

## Fix 3: Tighten email validation

**Bug:** C  
**Files:** `src/validation.js`, `src/routes/auth.routes.js`, `src/routes/payment.routes.js`  
**Change:** Share one format validator that requires a dot and a non-empty suffix following the domain.  
**Why:** Rejects malformed addresses consistently at registration and payment creation. This remains lightweight format validation rather than full RFC validation.  
**Verification:** HTTP tests reject `user@domain` and accept a normal address at registration and payment. A manual registration request for `user@domain` returned HTTP 400.

## Fix 4: Verify payment webhook signatures

**Bug:** D  
**Files:** `src/routes/webhook.routes.js`  
**Change:** Capture the exact JSON request bytes and compute HMAC-SHA256 with `WEBHOOK_SECRET` (overridable through the environment), validate digest syntax/length, and compare using `crypto.timingSafeEqual`. Invalid signatures return 401.  
**Why:** Prevents forged unsigned status updates and avoids ordinary string comparison for the digest.  
**Verification:** HTTP tests reject missing and incorrect signatures and accept a correctly signed request. A manual correctly signed webhook returned HTTP 200. The exact raw-body scheme avoids JSON whitespace/key-format ambiguity; load secrets from a managed secret store in production.

## Fix 5: Deduplicate webhook event IDs

**Bug:** E  
**Files:** `src/routes/webhook.routes.js`  
**Change:** Require a non-empty `event_id`, trim it consistently, check the processed-event collection, and record an ID only after finding and updating its payment. Validate status against supported values.  
**Why:** Provider retries become safe and unknown states are not persisted.  
**Verification:** HTTP tests and manual retries of a signed duplicate returned HTTP 200 with `Already processed`; invalid event and payment data are rejected. The in-memory collection is suitable only for this demo; production needs durable unique event IDs and an atomic transaction.

## Fix 6: Prevent duplicate pending table orders

**Bug:** F  
**Files:** `src/routes/table-order.routes.js`  
**Change:** Reject a second pending order for the same merchant and table with HTTP 409, comparing merchant IDs consistently as strings. Once the earlier order leaves `pending`, a new order is allowed.  
**Why:** Avoids duplicate active kitchen orders while allowing later service at that table.  
**Verification:** Automated tests cover conflict and subsequent order after serving the first. Manual duplicate POSTs returned HTTP 201 then HTTP 409. The in-memory check is not concurrency-safe across processes; production should enforce this in storage.

## Fix 7: Prevent repeat e-invoice submissions

**Bug:** G  
**Files:** `src/routes/einvoice.routes.js`  
**Change:** Validate the 14-digit numeric SIRET before creating a demo invoice, then return HTTP 409 when the invoice is already `submitted` or `accepted`. Invalid requests no longer leave draft invoices behind.  
**Why:** Avoids issuing multiple tax-authority submissions for the same invoice.  
**Verification:** Tests reject malformed SIRETs, submit once successfully, and assert a duplicate is rejected. Manual submissions returned HTTP 200 then HTTP 409.

## Assignment setup repair

The seeded merchant's password hash was not a usable bcrypt hash. `src/db/database.js` now generates a valid hash for the documented `Test123!` password at initialization, so the README login example and automated API tests work.
