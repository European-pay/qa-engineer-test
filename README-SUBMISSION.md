# QA Engineer Assignment Submission

## Approach
I reviewed the payment, authentication, webhook, table-order, and e-invoice routes and addressed the seven reported bug categories. I added automated HTTP tests using Node's built-in test runner and Supertest, and separated Express application setup from server startup to make route testing easier. The supporting documents describe the reported defects, implemented fixes, test coverage, and remaining limitations.

## Run the Application
Install dependencies:

`npm install`

Start the server:

`npm start`

## Run Automated Tests

`npm test`

## Verify Bug Signatures

`npm run verify-bugs`

The verification script checks for the presence of the original buggy patterns. A result showing that a bug is missing may mean the corresponding defect has been fixed; it should not automatically be interpreted as a test failure.

## Submission Documents
- `bug-reports.md`: Defects, impact, root causes, and fixes.
- `fixes.md`: Implementation summary and known limitations.
- `test-plan.md`: Automated, manual, security, and edge-case test plan.

## Limitations
The current application uses in-memory data storage, so data and webhook idempotency records do not persist across restarts. Test secrets must be replaced with secure environment-based configuration, and production concurrency and real tax-authority integration require further work.
