import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../server.js';
import { registerMerchant } from './test-helpers.js';

test('e-invoice submission rejects invalid SIRET values', async () => {
  const { token } = await registerMerchant();
  const response = await request(app).post('/api/einvoice/submit').set('Authorization', `Bearer ${token}`).send({ invoice_id: `inv-${Date.now()}`, customer_siret: '123' });
  assert.equal(response.status, 400);
});

test('e-invoice submission is idempotent', async () => {
  const { token } = await registerMerchant();
  const invoice_id = `inv-${Date.now()}-${Math.random()}`;
  const payload = { invoice_id, customer_siret: '12345678901234' };
  const first = await request(app).post('/api/einvoice/submit').set('Authorization', `Bearer ${token}`).send(payload);
  const second = await request(app).post('/api/einvoice/submit').set('Authorization', `Bearer ${token}`).send(payload);
  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
});
