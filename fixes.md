## Fix 1: Payment Amount Data Type

**Bug:** Amount was returned as a string instead of a number.

**File:** `src/routes/payment.routes.js`

**Change:**
```diff
- amount: p.amount.toString(),
+ amount: p.amount,
```

**Why:** Keeps `amount` as a number so the frontend can perform calculations and sorting without extra conversion.

**Testing:**  
Call `GET /api/payments` with a valid Bearer token and confirm that `amount` is returned without quotes.

---

## Fix 2: Stricter Email Validation

**Bug:** Invalid emails such as `user@domain` were accepted.

**File:** `src/routes/auth.routes.js`

**Change:**
```diff
- const emailRegex = /^[^\s@]+@[^\s@]+$/;
+ const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Why:** Requires a domain extension such as `.com` or `.org`.

**Testing:**  
Send `POST /api/auth/register` with `user@domain` and confirm that the API returns `400 Bad Request`.

---

## Fix 3: Maximum Transaction Limit

**Bug:** There was no upper limit on payment amounts.

**File:** `src/routes/payment.routes.js`

**Change:**
```diff
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

+ if (amount > 50000) {
+   return res.status(400).json({
+     error: 'Amount exceeds maximum transaction limit'
+   });
+ }
```

**Why:** Prevents accidentally or intentionally creating extremely large transactions.

**Testing:**  
Send a payment with `amount: 999999999` and confirm that the API returns `400 Bad Request`.

---

## Fix 4: Prevent Duplicate E-Invoice Submissions

**Bug:** An invoice could be submitted multiple times.

**File:** `src/routes/einvoice.routes.js`

**Change:**
```diff
  if (!customer_siret || customer_siret.length !== 14) {
    return res.status(400).json({
      error: 'Valid customer SIRET required for e-invoicing (14 digits)'
    });
  }

+ if (
+   invoice.einvoice_status === 'submitted' ||
+   invoice.einvoice_status === 'accepted'
+ ) {
+   return res.status(409).json({
+     error: 'Invoice already submitted to tax authority'
+   });
+ }
```

**Why:** Prevents the same invoice from being submitted more than once.

**Testing:**  
Send the same `POST /api/einvoice/submit` request twice. The first request should succeed, while the second should return `409 Conflict`.

---

## Fix 5: Prevent Duplicate Table Orders

**Bug:** Multiple pending orders could be created for the same table.

**File:** `src/routes/table-order.routes.js`

**Change:**
```diff
  if (items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

+ const existingOrder = (db.table_orders || []).find(
+   o =>
+     o.merchant_id === merchant_id &&
+     o.table_number === table_number &&
+     o.status === 'pending'
+ );

+ if (existingOrder) {
+   return res.status(409).json({
+     error: 'Table already has a pending order'
+   });
+ }
```

**Why:** Prevents duplicate active orders for the same table, reducing the chance of double orders and billing issues.

**Testing:**  
Send the same `POST /api/table-orders` request twice while the first order is pending. The second request should return `409 Conflict`.