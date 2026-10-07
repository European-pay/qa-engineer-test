import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

async function getAuthToken() {
  const email = 'einvoice.test@example.com';
  const password = 'Test12345!';

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      business_name: 'E-Invoice Test Business'
    });

  if (registerResponse.status === 201) {
    return registerResponse.body.token;
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password
    });

  return loginResponse.body.token;
}

test('submits an e-invoice with valid data', async () => {
  const token = await getAuthToken();

  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invoice_id: 'INV-TEST-001',
      customer_siret: '12345678901234'
    });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
});

test('rejects duplicate e-invoice submission', async () => {
  const token = await getAuthToken();

  const invoice = {
    invoice_id: 'INV-DUPLICATE-001',
    customer_siret: '12345678901234'
  };

  const firstResponse = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send(invoice);

  assert.strictEqual(firstResponse.status, 200);

  const secondResponse = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send(invoice);

  assert.strictEqual(secondResponse.status, 409);
  assert.strictEqual(
    secondResponse.body.error,
    'Invoice already submitted to tax authority'
  );
});

test('rejects invalid customer SIRET', async () => {
  const token = await getAuthToken();

  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invoice_id: 'INV-INVALID-SIRET',
      customer_siret: '12345'
    });

  assert.strictEqual(response.status, 400);
});

test('rejects submission without invoice id', async () => {
  const token = await getAuthToken();

  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      customer_siret: '12345678901234'
    });

  assert.strictEqual(response.status, 400);
});

test('rejects unauthenticated e-invoice submission', async () => {
  const response = await request(app)
    .post('/api/einvoice/submit')
    .send({
      invoice_id: 'INV-UNAUTH-001',
      customer_siret: '12345678901234'
    });

  assert.strictEqual(response.status, 401);
});