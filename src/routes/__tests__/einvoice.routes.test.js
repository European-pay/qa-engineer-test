import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

describe('E-Invoice Routes Tests', () => {
  let authToken;
  const invoiceId = `inv_${Date.now()}`;

  before(async () => {
    const email = `einvoice_test_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      email,
      password: 'securepassword123',
      business_name: 'E-Invoice Merchant'
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password: 'securepassword123'
    });

    authToken = loginRes.body.token;
  });

  describe('POST /api/einvoice/submit', () => {
    test('should submit an invoice successfully on first attempt', async () => {
      const res = await request(app)
        .post('/api/einvoice/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoice_id: invoiceId,
          customer_siret: '12345678901234'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'submitted');
    });

    test('should prevent duplicate submissions of the same invoice', async () => {
      const res = await request(app)
        .post('/api/einvoice/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoice_id: invoiceId,
          customer_siret: '12345678901234'
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error, 'Invoice already submitted to tax authority');
    });
  });
});