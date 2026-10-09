# Bug Reports

Tested the API by actually running it and hitting endpoints with curl + Postman.
Went through auth first, then payments, then the weirder stuff like webhooks and e-invoice.
Found all 7.

---

## Bug A: Payment amount comes back as a string

**Location:** src/routes/payment.routes.js (lines 16, 52)  
**Severity:** Medium  
**Component:** Payment API

**How to Reproduce:**

1. `npm start`
2. `POST /api/auth/login` with `{"email":"merchant@test.com","password":"Test123!"}`
3. `GET /api/payments` with the token in Authorization header
4. Check the `amount` field in the response

**Expected:** `"amount": 25.5`

**Actual:** `"amount": "25.5"` — it's a string

**Impact:**  
Any frontend doing math on this will silently break. `"25.5" + 10` gives `"25.510"` in JS.
Stripe, PayPal — all return amounts as numbers. This would cause bugs in any integration.

**Root Cause:**  
Line 16: `amount: p.amount.toString()` — whoever wrote this either meant to do something
else or just forgot to remove the `.toString()`. Same bug on line 52 for the single payment endpoint.

**Suggested Fix:**  
Just remove the `.toString()`. The value in the DB is already a float.

---

## Bug B: No upper limit on payment amount

**Location:** src/routes/payment.routes.js (lines 71-77)  
**Severity:** High  
**Component:** Payment API

**How to Reproduce:**

1. Login, get token
2. `POST /api/payments` with `{"amount": 999999999, "currency": "EUR", "customer_email": "test@test.com"}`
3. Gets a 201 back, payment created

**Expected:** Should reject anything over some reasonable cap — €50,000 is standard

**Actual:** Creates the payment with no complaint

**Impact:**  
Payment processors like Powens have their own hard limits, so this would fail downstream
anyway — but you'd have a corrupt record in your DB showing a payment that will never
go through. Also a sign that input validation isn't being taken seriously.

**Root Cause:**  
There's a check for `amount <= 0` but nothing on the other end. The comment in the file
literally says "BUG B" so this was left intentionally, but in a real codebase this would
be a simple oversight.

**Suggested Fix:**  
Add `if (amount > 50000) return res.status(400).json({ error: '...' })` right after the min check.

---

## Bug C: Email validation accepts addresses without a TLD

**Location:** src/routes/auth.routes.js (line 12)  
**Severity:** Medium  
**Component:** Auth API

**How to Reproduce:**

1. `POST /api/auth/register` with `{"email":"user@domain","password":"Test123!","business_name":"Test Co"}`
2. Registration succeeds — gets a 201 back

**Expected:** `user@domain` is not a valid email, should return 400

**Actual:** Accepted as valid, account gets created

**Impact:**  
Users end up with undeliverable email addresses. Password reset emails, receipts,
notifications — all would bounce. In a payment system this is a real problem.

**Root Cause:**  
The regex on line 12 is `/^[^\s@]+@[^\s@]+$/` — it checks for `@` and no spaces,
but doesn't require a dot in the domain part. So `user@localhost`, `user@domain`,
`x@y` all pass.

**Suggested Fix:**  
Change the regex to require at least one dot after the `@`:
`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

---

## Bug D: Webhook endpoint accepts requests with any signature (or no signature)

**Location:** src/routes/webhook.routes.js (lines 21-32)  
**Severity:** Critical  
**Component:** Webhooks

**How to Reproduce:**

1. `POST /api/webhooks/payment-status` with a completely fake signature header
2. `{"payment_id":"1","status":"completed","event_id":"evt_fake"}`
3. Header: `x-webhook-signature: imafarke`
4. Returns 200, payment status updated

**Expected:** Should verify the HMAC-SHA256 signature and reject if it doesn't match

**Actual:** Doesn't check the signature at all, processes any request

**Impact:**  
This is a serious one. Anyone who knows the endpoint exists can mark any payment
as "completed" without ever actually paying. In production this is fraud territory.
Powens (and every other payment provider) sign their webhooks for exactly this reason.

**Root Cause:**  
The verification code is literally right there in the file — lines 25-32 — but it's all
commented out. Probably disabled for local testing and never re-enabled.

**Suggested Fix:**  
Uncomment the signature check and make sure it runs before any processing:
```js
const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== expectedSig) return res.status(401).json({ error: 'Invalid signature' });
```

---

## Bug E: Duplicate webhooks get processed multiple times

**Location:** src/routes/webhook.routes.js (lines 38-44)  
**Severity:** High  
**Component:** Webhooks

**How to Reproduce:**

1. Send `POST /api/webhooks/payment-status` with `event_id: "evt_123"` — processes fine
2. Send the exact same request again with the same `event_id`
3. Also returns 200 — processes again

**Expected:** Second request should return 200 but skip processing (already handled)

**Actual:** Re-processes the webhook, updates the payment status again

**Impact:**  
Webhooks get retried all the time — network issues, timeouts, provider retries.
If a status update gets applied twice, it could flip a payment back to a wrong state.
In financial systems idempotency isn't optional.

**Root Cause:**  
The `processed_webhooks` array exists in the DB (`db.processed_webhooks = []`) and
there's even commented-out code that would use it — lines 42-44, 56. Just never enabled.

**Suggested Fix:**  
Check `db.processed_webhooks.includes(event_id)` before processing, and push the
`event_id` to the array after a successful update.

---

## Bug F: Same table can have multiple pending orders at once

**Location:** src/routes/table-order.routes.js (lines 44-55)  
**Severity:** Medium  
**Component:** Table Orders

**How to Reproduce:**

1. `POST /api/table-orders` with `{"merchant_id":"1","table_number":5,"items":[{"name":"Coffee","price":3,"quantity":1}]}`
2. Send the exact same request again
3. Both return 201 — two pending orders for table 5

**Expected:** Should reject the second order if table 5 already has a pending one

**Actual:** Happily creates a second (and third, and fourth...) order for the same table

**Impact:**  
Kitchen gets confused, staff gets confused, customers get double-billed potentially.
In a real restaurant system this would cause chaos during a busy service.

**Root Cause:**  
No check before creating the order. The commented-out code (lines 48-55) shows
exactly what should be there — it just wasn't uncommented.

**Suggested Fix:**  
Check if there's already a pending order for that merchant + table combo before creating a new one.

---

## Bug G: Same invoice can be submitted to tax authority multiple times

**Location:** src/routes/einvoice.routes.js (lines 50-58)  
**Severity:** Medium  
**Component:** E-Invoice

**How to Reproduce:**

1. Login, get token
2. `POST /api/einvoice/submit` with `{"invoice_id":"inv_001","customer_siret":"12345678901234"}`
3. Returns 200, status = "submitted"
4. Send the exact same request again
5. Returns 200 again — same invoice submitted twice

**Expected:** Should return 409 if the invoice is already submitted or accepted

**Actual:** Re-submits without any check, generates a new submission_id

**Impact:**  
With French tax authority (Seqino PDP), submitting the same invoice twice would
likely cause a rejection or duplicate filing. At minimum it overwrites the original
submission_id, so you lose track of which submission is the real one.

**Root Cause:**  
Same pattern as bugs E and F — the check is literally written in the comments (lines 54-57)
but commented out and never activated.

**Suggested Fix:**  
Before submitting, check if `invoice.einvoice_status` is already `submitted` or `accepted`
and return a 409 if so.
