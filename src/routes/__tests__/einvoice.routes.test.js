import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../app.js';
import jwt from 'jsonwebtoken';
import { setupTestDatabase } from './test-setup.js';

setupTestDatabase()


test('POST /api/einvoice/submit create test einvoices', async () => {

   const token = jwt.sign(
      { id: '1', email: 'merchant@test.com',type: 'merchant'},
      'test-secret-key-do-not-use-in-production'
    );
  
  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invoice_id: '1',
      customer_siret: '12345678901234'
    });

  assert.equal(response.body.message,'Invoice submitted to tax authority')
  assert.equal(response.status, 200);
});

test('POST /api/einvoice/submit prevent submitting the same invoice twice', async () => {

   const token = jwt.sign(
      { id: '1', email: 'merchant@test.com',type: 'merchant'},
      'test-secret-key-do-not-use-in-production'
    );
  
  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invoice_id: '1',
      customer_siret: '12345678901234'
    });

  assert.equal(response.body.error,'Invoice already submitted to tax authority')
  assert.equal(response.status, 409);
});