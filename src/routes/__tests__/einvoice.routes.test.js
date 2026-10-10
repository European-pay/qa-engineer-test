import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';
import { v4 as uuidv4 } from 'uuid';

async function getToken() {
  const email = `merchant_einvoice${uuidv4()}@test.com`;
  await request(app).post('/api/auth/register').send({
    email,
    password: 'TestPassword123!',
    business_name: 'Test Business'
  });
  const res = await request(app).post('/api/auth/login').send({
    email,
    password: 'TestPassword123!'
  });
  return res.body.token;
}

test('Bug G: E-Invoice - should prevent duplicate submission', async () => {
  const token = await getToken();
  const payload = {
    invoice_id: `INV-${uuidv4()}`,
    customer_siret: '12345678901234'
  };

  // First submission should succeed
  const res1 = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  
  assert.strictEqual(res1.status, 200);

  // Second submission should fail
  const res2 = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  
  assert.strictEqual(res2.status, 409);
  assert.strictEqual(res2.body.error, 'Invoice already submitted to tax authority');
});
