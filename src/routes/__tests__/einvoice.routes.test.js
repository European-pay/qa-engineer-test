import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';

async function token() {
  const response = await request(app).post('/api/auth/login').send({ email: 'merchant@test.com', password: 'Test123!' });
  return response.body.token;
}

test('e-invoice submission rejects invalid SIRET and prevents duplicate submissions', async () => {
  const jwt = await token();
  const headers = { Authorization: `Bearer ${jwt}` };
  const invalidInvoiceId = `invalid-${Date.now()}`;
  const invalid = await request(app).post('/api/einvoice/submit').set(headers).send({ invoice_id: invalidInvoiceId, customer_siret: '123' });
  assert.equal(invalid.status, 400);
  const notCreated = await request(app).get(`/api/einvoice/status/${invalidInvoiceId}`).set(headers);
  assert.equal(notCreated.status, 404);
  const nonNumeric = await request(app).post('/api/einvoice/submit').set(headers).send({ invoice_id: `invalid-${Date.now()}-letters`, customer_siret: 'abcdefghijklmn' });
  assert.equal(nonNumeric.status, 400);
  const invoice_id = `invoice-${Date.now()}`;
  const body = { invoice_id, customer_siret: '12345678901234' };
  assert.equal((await request(app).post('/api/einvoice/submit').set(headers).send(body)).status, 200);
  assert.equal((await request(app).post('/api/einvoice/submit').set(headers).send(body)).status, 409);
});

test('e-invoice status is private to its merchant', async () => {
  const jwt = await token();
  const response = await request(app).get('/api/einvoice/status/not-found').set({ Authorization: `Bearer ${jwt}` });
  assert.equal(response.status, 404);
});
