#!/usr/bin/env node
/**
 * Bug Verification Script
 * Confirms that all 3 intentional bugs are present in the codebase
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

console.log("🔍 Verifying bugs are present in the codebase...\n");

let bugsFound = 0;

// Bug A: Check payment.routes.js for amount.toString()
try {
  const paymentRoutesPath = join(projectRoot, "src/routes/payment.routes.js");
  const content = readFileSync(paymentRoutesPath, "utf-8");

  if (
    content.includes("amount: p.amount.toString()") ||
    content.includes("amount: payment.amount.toString()")
  ) {
    console.log("✅ Bug A found: amount.toString() in payment.routes.js");
    bugsFound++;
  } else {
    console.log(
      "❌ Bug A missing: amount should be converted to string (incorrectly)",
    );
  }
} catch (err) {
  console.log("⚠️  Bug A: Cannot verify (file not found?)");
}

// Bug B: Check payment.routes.js for missing max amount validation
try {
  const paymentRoutesPath = join(projectRoot, "src/routes/payment.routes.js");
  const content = readFileSync(paymentRoutesPath, "utf-8");

  // Look for actual if statement checking max amount (not in comments)
  // Match pattern: amount > 50000 or amount > MAX_AMOUNT as actual code
  const lines = content.split("\n");
  let hasActualMaxCheck = false;

  for (const line of lines) {
    // Skip comment lines
    if (line.trim().startsWith("//")) continue;
    // Check if line has actual validation code
    if (
      /if\s*\([^)]*amount\s*>\s*\d+/.test(line) ||
      /if\s*\([^)]*amount\s*<\s*\d+/.test(line)
    ) {
      hasActualMaxCheck = true;
      break;
    }
  }

  const hasBugComment = content.includes("BUG B:");
  const hasMinCheck = content.includes("amount <= 0");

  if (!hasActualMaxCheck && hasBugComment && hasMinCheck) {
    console.log("✅ Bug B found: Missing maximum amount validation");
    bugsFound++;
  } else if (hasActualMaxCheck) {
    console.log("❌ Bug B already fixed: Maximum amount check is present");
  } else {
    console.log("❌ Bug B missing: Should have validation bug");
  }
} catch (err) {
  console.log("⚠️  Bug B: Cannot verify (file not found?)");
}

// Bug C: Check auth.routes.js for email validation regex
try {
  const authRoutesPath = join(projectRoot, "src/routes/auth.routes.js");
  const content = readFileSync(authRoutesPath, "utf-8");

  // Look for the buggy regex that doesn't require TLD
  if (
    content.includes("/^[^\\s@]+@[^\\s@]+$/") ||
    content.includes("/^[^s@]+@[^s@]+$/")
  ) {
    console.log("✅ Bug C found: Email validation regex too permissive");
    bugsFound++;
  } else {
    console.log("❌ Bug C missing: Email regex should be permissive (buggy)");
  }
} catch (err) {
  console.log("⚠️  Bug C: Cannot verify (file not found?)");
}

console.log(`\n📊 Bugs found: ${bugsFound}/3`);

if (bugsFound === 3) {
  console.log("\n✅ All bugs are present! Repository is ready for candidates.");
  process.exit(0);
} else {
  console.log("\n⚠️  Some bugs are missing. Please check the code.");
  process.exit(1);
}
