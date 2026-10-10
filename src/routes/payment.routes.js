import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createPayment, getPayments, getPaymentById } from '../db/database.js';
import { isValidEmail } from '../validation.js';

const router = express.Router();

// GET /api/payments - List all payments for authenticated merchant
router.get('/', authenticate, (req, res) => {
  try {
    const merchantId = req.user.id;
    const payments = getPayments(merchantId);

    const formattedPayments = payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      customer_email: p.customer_email,
      created_at: p.created_at
    }));

    res.json({
      success: true,
      data: formattedPayments,
      count: formattedPayments.length
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/:id - Get single payment
router.get('/:id', authenticate, (req, res) => {
  try {
    const payment = getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify ownership
    if (payment.merchant_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        customer_email: payment.customer_email,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// POST /api/payments - Create new payment
router.post('/', authenticate, (req, res) => {
  try {
    const { amount, currency, customer_email } = req.body || {};

    // Validation
    const numericAmount = typeof amount === 'number'
      ? amount
      : typeof amount === 'string' && amount.trim() !== ''
        ? Number(amount)
        : Number.NaN;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Enforce the per-transaction cap before creating a payment record.
    if (numericAmount > 50000) {
      return res.status(400).json({ error: 'Amount exceeds the maximum of 50000' });
    }

    if (!currency || !['EUR', 'USD', 'GBP'].includes(currency)) {
      return res.status(400).json({ error: 'Valid currency is required (EUR, USD, GBP)' });
    }

    if (!isValidEmail(customer_email)) {
      return res.status(400).json({ error: 'Valid customer email is required' });
    }

    const payment = createPayment({
      merchant_id: req.user.id,
      amount: numericAmount,
      currency,
      customer_email,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payment created',
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customer_email: payment.customer_email
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

export default router;
