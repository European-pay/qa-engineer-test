# EU Pay — QA Engineer Technical Assignment

## Overview

This submission contains the testing, bug identification, bug fixes, automated regression tests, and documentation completed for the EU Pay QA Engineer technical assignment.

The application was tested through actual API requests before implementing the fixes.

---

## Bugs Identified

All 7 intentional bugs were identified:

| Bug | Area | Severity | Status |
|---|---|---|---|
| A | Payment API | Medium | Fixed |
| B | Payment API | High | Fixed |
| C | Auth API | Medium | Fixed |
| D | Webhooks | Critical | Fixed |
| E | Webhooks | High | Fixed |
| F | Table Orders | Medium | Fixed |
| G | E-Invoice | Medium | Fixed |

### Key Issues Found

- Payment amount returned as a string instead of a number.
- Payment amounts above €50,000 were accepted.
- Invalid email addresses without a domain extension were accepted.
- Webhook signatures were not verified.
- Duplicate webhook events could be processed multiple times.
- Multiple pending orders could be created for the same table.
- The same e-invoice could be submitted multiple times.

---

## Fixes Implemented

All 7 identified bugs were fixed.

### Payment API

- Payment amounts are returned as numeric values.
- Maximum payment amount of €50,000 is enforced.

### Authentication

- Email validation now requires a valid domain extension.

### Webhooks

- HMAC-SHA256 signature verification was implemented.
- Missing and invalid signatures are rejected.
- Webhook event IDs are tracked to prevent duplicate processing.

### Table Orders

- Duplicate pending orders for the same merchant and table are rejected.
- New orders are allowed after the previous order is no longer pending.

### E-Invoices

- Duplicate invoice submissions are prevented.
- Already submitted or accepted invoices cannot be submitted again.

Detailed fix information is available in `fixes.md`.

---

## Automated Testing

Automated tests were implemented using:

- Node.js built-in test runner
- Supertest
- Node.js Assert
- Crypto/HMAC utilities for webhook testing

### Test Distribution

| Test Area | Tests |
|---|---:|
| Authentication | 10 |
| E-Invoice | 5 |
| Payments | 10 |
| Table Orders | 4 |
| Webhooks | 5 |
| **Total** | **34** |

### Test Result

```text
34 tests
34 passed
0 failed

## How to Run

### 1. Install dependencies

```bash
npm install

### 2. Start the application

```bash
npm start
```

The API runs at:

```text
http://localhost:3000
```

### 3. Run automated tests

```bash
npm test
```

### 4. Run bug verification

```bash
npm run verify-bugs
```

> `verify-bugs` is a source-pattern verification script from the assignment repository. Since the intentional bugs have been fixed, it reports the buggy patterns as missing/already fixed. The authoritative regression check is the automated test suite.

---

## Testing Approach

Testing covered:

- Functional testing
- Negative testing
- Security testing
- Edge-case testing
- Integration testing
- Automated regression testing

### Security-Focused Scenarios

Security-focused scenarios included:

- Authentication enforcement
- Invalid webhook signatures
- Missing webhook signatures
- Duplicate webhook events
- Input validation
- Duplicate resource submissions

### Additional Security Areas Considered

The following areas were also considered for further testing:

- SQL injection
- XSS
- JWT manipulation
- IDOR/authorization issues
- Replay attacks
- Rate limiting
- Brute-force login attempts

---

## Documentation

The following documentation is included:

| File | Description |
|---|---|
| `bug-reports.md` | Detailed reproduction steps, expected/actual behavior, root causes, and fixes |
| `fixes.md` | Technical details of the implemented fixes and verification |
| `test-plan.md` | Testing scope, strategy, scenarios, security testing, and exit criteria |
| `README-SUBMISSION.md` | Final submission overview |

---

## Final Status

```text
Intentional bugs identified: 7/7
Bugs fixed: 7/7
Automated tests: 34/34 passing
Test failures: 0
```

The implementation was manually tested first to reproduce the identified issues, followed by automated regression tests to verify the fixes.