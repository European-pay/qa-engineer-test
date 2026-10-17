# QA Assignment Submission

I tested the Node.js payment API through manual smoke requests and automated API tests, identified all seven intentional bugs, and fixed the payment, authentication, webhook, table-order, and e-invoicing issues. The fixes include numeric amount validation, HMAC signature verification with timing-safe comparison, webhook and submission idempotency, and duplicate-order prevention. I added 14 regression tests using Node's built-in test runner and documented reproduction steps, fixes, and a webhook-focused test plan. `npm test` passes with all 14 tests.
