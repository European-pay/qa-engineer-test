# QA Engineer Assignment Submission

## Overview

I systematically tested the EuPay API using happy-path, negative, security, edge-case, concurrency, and integration scenarios. I identified and addressed all seven assigned bug areas across Authentication, Payments, Webhooks, Table Orders, and E-Invoice APIs. I implemented production-oriented fixes and added automated tests using Node.js's built-in `node:test` runner to prevent the identified bugs from recurring. The webhook payment flow was also documented with a dedicated test plan covering security, replay attacks, duplicate events, edge cases, integration, and production risks.

## Deliverables

- `bug-reports.md` — Bug findings and reproduction steps
- `fixes.md` — Bug fixes and technical explanations
- `test-plan.md` — Webhook payment flow test strategy
- `src/routes/*.js` — Fixed API route files
- `src/routes/__tests__/*.test.js` — Automated test suite

## Test Results

```text
npm test

Tests: 30
Passed: 30
Failed: 0
```

All automated tests are currently passing.