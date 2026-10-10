#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

const checks = [
  {
    name: 'Bug A',
    file: 'src/routes/payment.routes.js',
    passes: content => content.includes('amount: Number(p.amount)') && content.includes('amount: Number(payment.amount)'),
    message: 'payment response amounts are numeric'
  },
  {
    name: 'Bug B',
    file: 'src/routes/payment.routes.js',
    passes: content => content.includes('numericAmount > 50000'),
    message: 'payment amounts above EUR 50,000 are rejected'
  },
  {
    name: 'Bug C',
    file: 'src/routes/auth.routes.js',
    passes: content => content.includes('const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;'),
    message: 'registration requires an email domain suffix'
  },
  {
    name: 'Bug D',
    file: 'src/routes/webhook.routes.js',
    passes: content => content.includes('createHmac') && content.includes('timingSafeEqual'),
    message: 'webhook signatures are verified securely'
  },
  {
    name: 'Bug E',
    file: 'src/routes/webhook.routes.js',
    passes: content => content.includes('db.processed_webhooks.includes(event_id)') && content.includes('db.processed_webhooks.push(event_id)'),
    message: 'webhook event IDs are idempotent'
  },
  {
    name: 'Bug F',
    file: 'src/routes/table-order.routes.js',
    passes: content => content.includes('const existingOrder') && content.includes("o.status === 'pending'") && content.includes('res.status(409)'),
    message: 'duplicate pending table orders are rejected'
  },
  {
    name: 'Bug G',
    file: 'src/routes/einvoice.routes.js',
    passes: content => content.includes("invoice.einvoice_status === 'submitted'") && content.includes("invoice.einvoice_status === 'accepted'") && content.includes('res.status(409)'),
    message: 'duplicate e-invoice submissions are rejected'
  }
];

console.log('Verifying that all intentional bugs are fixed...\n');
let fixed = 0;

for (const check of checks) {
  const content = read(check.file);
  if (check.passes(content)) {
    console.log(`PASS ${check.name}: ${check.message}`);
    fixed++;
  } else {
    console.log(`FAIL ${check.name}: ${check.message}`);
  }
}

console.log(`\nFixed: ${fixed}/${checks.length}`);
process.exitCode = fixed === checks.length ? 0 : 1;
