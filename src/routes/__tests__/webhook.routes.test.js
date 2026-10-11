import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import request from 'supertest';
import app from '../../server.js';
import { db } from '../../db/database.js';

describe('Webhook Routes Tests', () => {
  const WEBHOOK_SECRET = 'test-webhook-secret-key';
  let testPaymentId;

  before(async () => {
    // Setup a mock payment to interact with via webhooks
    const merchantId = 'test-merchant-webhook';
    const payment = {
      id: `pay_${Date.now()}`,
      merchant_id: merchantId,
      amount: 50.0,
      currency: 'EUR',
      customer_email: 'webhooks@example.com',
      status: 'pending'
    };
    if (!db.payments) db.payments = [];
    db.payments.push(payment);
    testPaymentId = payment.id;
  });

  describe('POST /api/webhooks/payment-status', () => {
    test('should process a valid payment status webhook', async () => {
      const payload = {
        payment_id: testPaymentId,
        status: 'completed',
        event_id: `evt_${Date.now()}`
      };

      // Generate a valid signature matching the secret
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      const res = await request(app)
        .post('/api/webhooks/payment-status')
        .set('x-webhook-signature', signature)
        .send(payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.new_status, 'completed');
    });

    test('should fail if payment_id or status is missing', async () => {
      const res = await request(app)
        .post('/api/webhooks/payment-status')
        .send({ payment_id: testPaymentId }); 

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'payment_id and status required');
    });

    test('should return 404 if the payment does not exist', async () => {
      const res = await request(app)
        .post('/api/webhooks/payment-status')
        .send({
          payment_id: 'non_existent_payment_id',
          status: 'completed'
        });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Payment not found');
    });
  });

  describe('POST /api/webhooks/e-invoice', () => {
    const invoiceId = `inv_hook_${Date.now()}`;

    before(() => {
      // Setup a mock invoice for testing
      const invoice = {
        id: invoiceId,
        merchant_id: 'test-merchant-webhook',
        invoice_number: 'INV-WEB-001',
        amount: 200.0,
        currency: 'EUR',
        customer_siret: '12345678901234',
        einvoice_status: 'submitted'
      };
      if (!db.invoices) db.invoices = [];
      db.invoices.push(invoice);
    });

    test('should process e-invoice status update webhook successfully', async () => {
      const res = await request(app)
        .post('/api/webhooks/e-invoice')
        .send({
          invoice_id: invoiceId,
          status: 'accepted',
          submission_id: 'SUB-XYZ-999',
          tax_authority_id: 'TA-FR-123'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.status, 'accepted');
    });

    test('should return 404 for non-existent invoice webhooks', async () => {
      const res = await request(app)
        .post('/api/webhooks/e-invoice')
        .send({
          invoice_id: 'fake_invoice_id',
          status: 'accepted'
        });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Invoice not found');
    });
  });
});