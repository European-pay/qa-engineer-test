# EU Pay QA Engineer Assignment Submission

## Work completed
- Addressed seven identified defects across payments, authentication, webhooks, table orders, and e-invoicing.
- Added API regression tests using Node.js test runner and Supertest.
- Documented bug reports, fixes, and webhook test scenarios.

## Latest test result
Command: npm.cmd test

- Tests: 16
- Passed: 16
- Failed: 0
- Suites: 5

The total includes two placeholder tests and fourteen meaningful regression tests.

## Verification limitation
A previous run of npm.cmd run verify-bugs reported Bugs F and G as still present. The discrepancy has not yet been resolved. Do not claim the verification script passed.

## Future improvements
Persistent webhook idempotency, concurrency-safe duplicate prevention, secure secret management, and expanded integration tests.
