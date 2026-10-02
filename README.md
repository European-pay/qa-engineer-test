# EU Pay QA Engineer Test Assignment

Welcome! This is a simplified payment API with **3 intentional bugs** for you to find and fix.

---

## 🎯 Your Mission

1. **Find the bugs** through testing
2. **Fix the bugs** with code changes
3. **Write tests** to prevent regression
4. **Document** your findings

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- Postman or curl for API testing
- Code editor (VS Code recommended)

### Setup (< 2 minutes)

```bash
# Clone this repository
git clone https://github.com/europeanpay/qa-engineer-test.git
cd qa-engineer-test

# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

You should see:
```
✅ EU Pay QA Test API running on http://localhost:3000
📖 Visit http://localhost:3000 for available endpoints
📊 Database initialized with test data
```

---

## 📡 API Endpoints

Visit `http://localhost:3000` for full endpoint list.

### Authentication
- `POST /api/auth/register` — Register new merchant
- `POST /api/auth/login` — Login and get JWT token

### Payments (requires auth)
- `GET /api/payments` — List all payments
- `GET /api/payments/:id` — Get single payment
- `POST /api/payments` — Create new payment

---

## 🐛 The Bugs

There are **3 intentional bugs** in this codebase:

### Bug A: Data Type Issue
**Location:** `src/routes/payment.routes.js`  
**Hint:** Check the response format when getting payments  
**Severity:** Medium

### Bug B: Missing Validation
**Location:** `src/routes/payment.routes.js`  
**Hint:** What happens if someone tries to pay €999,999,999?  
**Severity:** High

### Bug C: Security Issue
**Location:** `src/routes/auth.routes.js`  
**Hint:** Try registering with email `user@domain` (no `.com`)  
**Severity:** Medium

---

## ✅ Your Tasks

### 1. Find the Bugs (30 minutes)
Test the API using Postman/curl and find all 3 bugs.

**Deliverable:** `bug-reports.md`

Format:
```markdown
## Bug 1: [Title]
**Location:** src/routes/[file].js (line X)
**Severity:** High / Medium / Low

**How to Reproduce:**
1. Send POST request to...
2. Observe response...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Root Cause:**
[Your analysis]
```

### 2. Fix the Bugs (60 minutes)
Edit the code to fix all 3 bugs.

**Deliverable:** 
- Fixed code in `src/routes/` files
- List of changed files in `fixes.md`

Format:
```markdown
## Fix 1: [Title]

**Files Changed:**
- src/routes/payment.routes.js (line 25)

**Code Change:**
\`\`\`diff
- amount: p.amount.toString(),
+ amount: parseFloat(p.amount),
\`\`\`

**Why This Fix:**
[Explanation]
```

### 3. Write Tests (30 minutes)
Add test cases to prevent these bugs from happening again.

**Deliverable:** 
- Tests in `src/routes/__tests__/` files

Example:
```javascript
test('should return amount as number not string', async () => {
  const payments = await getPayments('1');
  const firstPayment = payments[0];
  assert.strictEqual(typeof firstPayment.amount, 'number');
});
```

Run tests with:
```bash
npm test
```

### 4. Write Test Plan (30 minutes)
Document your testing approach.

**Deliverable:** `test-plan.md`

Include:
- **Test Scenarios** (at least 10)
- **Test Data** needed
- **Edge Cases** to cover
- **Security Tests**

---

## 📨 Submission

### What to Submit
1. `bug-reports.md` — All 3 bugs documented
2. `fixes.md` — How you fixed each bug
3. `test-plan.md` — Your testing strategy
4. Modified code files (with your fixes)
5. Test files (with your tests)

### How to Submit

**Option 1: GitHub (Preferred)**
```bash
# Fork this repo
# Create a branch
git checkout -b qa-submission-[yourname]

# Make your changes
git add .
git commit -m "QA assignment submission"
git push origin qa-submission-[yourname]

# Create a Pull Request
```

**Option 2: ZIP File**
```bash
# Create a ZIP of your work
zip -r qa-submission.zip . -x "node_modules/*" ".git/*"

# Email to: careers@european-pay.eu
# Subject: QA Engineer Assignment - [Your Name]
```

---

## ⏱️ Time Estimate

- Setup: 5 minutes
- Bug finding: 30 minutes
- Bug fixing: 60 minutes
- Test writing: 30 minutes
- Documentation: 30 minutes

**Total: ~2.5 hours**

---

## 📋 Verification

Before submitting, check:

- [ ] All 3 bugs found and documented
- [ ] All 3 bugs fixed in code
- [ ] At least 5 tests written
- [ ] All tests pass (`npm test`)
- [ ] Bug verification passes (`npm run verify-bugs` — should now FAIL if you fixed the bugs!)
- [ ] Test plan includes edge cases and security tests
- [ ] Code is clean and readable
- [ ] Documentation is clear

---

## 🆘 Need Help?

**Technical Issues:**
- Make sure Node.js 20+ is installed: `node --version`
- Port 3000 busy? Change it: `PORT=3001 npm start`
- Dependencies issue? `rm -rf node_modules && npm install`

**Assignment Questions:**
- Email: tech-hiring@european-pay.eu
- Response time: Within 24 hours

---

## 💡 Tips

- **Don't overthink it** — The bugs are intentional and findable
- **Think like a user** — What could go wrong in production?
- **Test edge cases** — Zero amounts, negative numbers, very large numbers, special characters
- **Document clearly** — We evaluate communication skills too
- **Write clean code** — Readable > clever

---

## 🚫 What NOT to Do

- ❌ Don't just read the code — actually TEST the API
- ❌ Don't fix bugs you didn't find through testing
- ❌ Don't skip the tests — we want to see you can write them
- ❌ Don't use AI to write everything — we'll know in the interview
- ❌ Don't spend more than 4 hours — if stuck, submit what you have

---

## 📖 About EU Pay

EU Pay is a fintech company building payment solutions for European merchants. Our stack:
- **Backend:** Node.js, Express, PostgreSQL
- **Mobile:** Flutter (iOS + Android)
- **Web:** Next.js
- **Cloud:** AWS (ECS, RDS, ElastiCache)

This test assignment mirrors real work you'll do:
- Finding bugs before they reach production
- Fixing bugs with clean, tested code
- Writing comprehensive test coverage
- Documenting issues clearly for the team

---

**Good luck! We're excited to see your work.** 🚀

---

**Questions? Email tech-hiring@european-pay.eu**
