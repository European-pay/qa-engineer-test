#!/usr/bin/env node
// Static regression guard for the seven fixes from the assignment.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const files = {
  payments: readFileSync(resolve(root, 'src/routes/payment.routes.js'), 'utf8'),
  auth: readFileSync(resolve(root, 'src/routes/auth.routes.js'), 'utf8'),
  validation: readFileSync(resolve(root, 'src/validation.js'), 'utf8'),
  webhooks: readFileSync(resolve(root, 'src/routes/webhook.routes.js'), 'utf8'),
  orders: readFileSync(resolve(root, 'src/routes/table-order.routes.js'), 'utf8'),
  invoices: readFileSync(resolve(root, 'src/routes/einvoice.routes.js'), 'utf8')
};

const checks = [
  ['A: payment amounts are numeric', /amount: Number\(p\.amount\)/.test(files.payments) && /amount: Number\(payment\.amount\)/.test(files.payments)],
  ['B: payment amount maximum is enforced', /numericAmount > 50000/.test(files.payments)],
  ['C: email requires a suffix after the domain', files.validation.includes(String.raw`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)],
  ['D: webhook signature uses HMAC and constant-time comparison', /createHmac\('sha256'/.test(files.webhooks) && /timingSafeEqual/.test(files.webhooks)],
  ['E: webhook event IDs are idempotent', /processed_webhooks\.includes\(normalizedEventId\)/.test(files.webhooks)],
  ['F: pending table orders are deduplicated', /existingOrder/.test(files.orders) && /status === 'pending'/.test(files.orders)],
  ['G: submitted invoices cannot be resubmitted', /\['submitted', 'accepted'\]\.includes\(invoice\.einvoice_status\)/.test(files.invoices)]
];

let failed = false;
for (const [description, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${description}`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
