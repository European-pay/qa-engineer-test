import express from 'express';
import crypto from 'crypto';
import { getPaymentById, db } from '../db/database.js';

const router = express.Router();

// Webhook secret for HMAC verification
const WEBHOOK_SECRET = 'test-webhook-secret-key';

function validSignature(signature, rawBody) {
  if (typeof signature !== 'string' || !Buffer.isBuffer(rawBody) || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || WEBHOOK_SECRET)
    .update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  // timingSafeEqual requires equal-length buffers.
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

/**
 * POST /api/webhooks/payment-status
 * 
 * Simulates external payment provider webhooks (like Powens)
 * Tests webhook signature verification and idempotency
 */
router.post('/payment-status', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    if (!validSignature(signature, req.rawBody)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const { payment_id, status, event_id } = req.body || {};

    if (!payment_id || !status || typeof event_id !== 'string' || !event_id.trim()) {
      return res.status(400).json({ error: 'payment_id, status, and event_id required' });
    }
    const normalizedEventId = event_id.trim();

    if (!['pending', 'completed', 'failed', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    if (db.processed_webhooks.includes(normalizedEventId)) {
      return res.status(200).json({ success: true, message: 'Already processed', payment_id });
    }

    const payment = getPaymentById(payment_id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    payment.status = status;
    payment.webhook_received_at = new Date();

    // Record only after the payment update succeeds so unknown payments remain retryable.
    db.processed_webhooks.push(normalizedEventId);

    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      payment_id,
      new_status: status
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/webhooks/e-invoice
 * 
 * Simulates e-invoice submission webhook from tax authority
 */
router.post('/e-invoice', (req, res) => {
  try {
    const { invoice_id, status, submission_id, tax_authority_id } = req.body || {};

    if (!invoice_id || !status) {
      return res.status(400).json({ error: 'invoice_id and status required' });
    }

    // Find invoice in database
    const invoice = db.invoices?.find(inv => inv.id === invoice_id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice status
    invoice.einvoice_status = status;
    invoice.einvoice_submission_id = submission_id;
    invoice.tax_authority_id = tax_authority_id;
    invoice.submitted_at = new Date();

    res.status(200).json({
      success: true,
      message: 'E-invoice webhook processed',
      invoice_id,
      status
    });
  } catch (error) {
    console.error('E-invoice webhook error:', error);
    res.status(500).json({ error: 'E-invoice webhook failed' });
  }
});

export default router;
