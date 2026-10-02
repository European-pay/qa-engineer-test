#!/usr/bin/env node
/**
 * Bug Verification Script
 * Confirms that all 3 intentional bugs are present in the codebase
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

console.log('🔍 Verifying bugs are present in the codebase...\n');

let bugsFound = 0;

// Bug A: Check payment.routes.js for amount.toString()
try {
  const paymentRoutesPath = join(projectRoot, 'src/routes/payment.routes.js');
  const content = readFileSync(paymentRoutesPath, 'utf-8');
  
  if (content.includes('amount: p.amount.toString()') || content.includes('amount: payment.amount.toString()')) {
    console.log('✅ Bug A found: amount.toString() in payment.routes.js');
    bugsFound++;
  } else {
    console.log('❌ Bug A missing: amount should be converted to string (incorrectly)');
  }
} catch (err) {
  console.log('⚠️  Bug A: Cannot verify (file not found?)');
}

// Bug B: Check payment.routes.js for missing max amount validation
try {
  const paymentRoutesPath = join(projectRoot, 'src/routes/payment.routes.js');
  const content = readFileSync(paymentRoutesPath, 'utf-8');
  
  // Check that there's NO check for maximum amount
  const hasMaxCheck = content.includes('amount > ') || content.includes('MAX_AMOUNT') || content.includes('amount < 50000');
  
  if (!hasMaxCheck && content.includes('amount <= 0')) {
    console.log('✅ Bug B found: Missing maximum amount validation');
    bugsFound++;
  } else {
    console.log('❌ Bug B missing: Should be missing max amount check');
  }
} catch (err) {
  console.log('⚠️  Bug B: Cannot verify (file not found?)');
}

// Bug C: Check auth.routes.js for email validation regex
try {
  const authRoutesPath = join(projectRoot, 'src/routes/auth.routes.js');
  const content = readFileSync(authRoutesPath, 'utf-8');
  
  // Look for the buggy regex that doesn't require TLD
  if (content.includes('/^[^\\s@]+@[^\\s@]+$/') || content.includes('/^[^s@]+@[^s@]+$/')) {
    console.log('✅ Bug C found: Email validation regex too permissive');
    bugsFound++;
  } else {
    console.log('❌ Bug C missing: Email regex should be permissive (buggy)');
  }
} catch (err) {
  console.log('⚠️  Bug C: Cannot verify (file not found?)');
}

console.log(`\n📊 Bugs found: ${bugsFound}/3`);

if (bugsFound === 3) {
  console.log('\n✅ All bugs are present! Repository is ready for candidates.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some bugs are missing. Please check the code.');
  process.exit(1);
}
