
import express from 'express';
import crypto from 'crypto';
import { getPaymentById, db } from '../db/database.js';

const router = express.Router();
const WEBHOOK_SECRET = 'test-webhook-secret-key';

function verifySignature(signature, body) {
  if (typeof signature !== 'string') {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  const received = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

/**
 * POST /api/webhooks/payment-status
 * Verify the webhook and process each event only once.
 */
router.post('/payment-status', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const { payment_id, status, event_id } = req.body;

    // FIX D: Reject invalid or missing signatures.
    if (!verifySignature(signature, req.body)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    if (!payment_id || !status || !event_id) {
      return res.status(400).json({
        error: 'payment_id, status and event_id required'
      });
    }

    const validStatuses = [
      'pending',
      'completed',
      'failed',
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid payment status'
      });
    }

    if (!Array.isArray(db.processed_webhooks)) {
      db.processed_webhooks = [];
    }

    // FIX E: Ignore events that have already been processed.
    if (db.processed_webhooks.includes(event_id)) {
      return res.status(200).json({
        success: true,
        message: 'Already processed',
        event_id
      });
    }

    const payment = getPaymentById(payment_id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = status;
    payment.webhook_received_at = new Date();

    // Record the event after successfully updating the payment.
    db.processed_webhooks.push(event_id);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
      payment_id,
      new_status: status
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed'
    });
  }
});

/**
 * POST /api/webhooks/e-invoice
 * Process an e-invoice status update.
 */
router.post('/e-invoice', (req, res) => {
  try {
    const {
      invoice_id,
      status,
      submission_id,
      tax_authority_id
    } = req.body;

    if (!invoice_id || !status) {
      return res.status(400).json({
        error: 'invoice_id and status required'
      });
    }

    const invoice = db.invoices?.find(inv => inv.id === invoice_id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    invoice.einvoice_status = status;
    invoice.einvoice_submission_id = submission_id;
    invoice.tax_authority_id = tax_authority_id;
    invoice.submitted_at = new Date();

    return res.status(200).json({
      success: true,
      message: 'E-invoice webhook processed',
      invoice_id,
      status
    });
  } catch (error) {
    console.error('E-invoice webhook error:', error);
    return res.status(500).json({
      error: 'E-invoice webhook failed'
    });
  }
});

export default router;
