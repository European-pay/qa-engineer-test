import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { resetDatabase } from '../../db/database.js';
import { registerMerchant } from './test-helpers.js';

beforeEach(() => resetDatabase());

test('Bug G: duplicate e-invoice submissions are rejected', async () => {
  const token = await registerMerchant('einvoice-duplicate');
  const payload = { invoice_id: 'invoice-1', customer_siret: '12345678901234' };

  const first = await request(app).post('/api/einvoice/submit').set('Authorization', `Bearer ${token}`).send(payload);
  const second = await request(app).post('/api/einvoice/submit').set('Authorization', `Bearer ${token}`).send(payload);

  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
  assert.match(second.body.error, /already submitted/i);
});

test('e-invoice submission rejects an invalid SIRET', async () => {
  const token = await registerMerchant('einvoice-validation');
  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({ invoice_id: 'invoice-invalid-siret', customer_siret: '123' });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /SIRET/i);
});

test('e-invoice status requires authentication', async () => {
  const response = await request(app).get('/api/einvoice/status/invoice-1');
  assert.equal(response.status, 401);
});
