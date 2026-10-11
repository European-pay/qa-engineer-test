import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import crypto from 'crypto'
import { app } from '../../app.js';
import { setupTestDatabase } from './test-setup.js';


setupTestDatabase()

test('POST/api/webhooks/payment-status webhook request with valid signature', async ()=> {
  const payload = {
    payment_id: '1',
    status: 'pending',
    event_id: 'test123'
  };

  const signature = crypto
    .createHmac('sha256', 'test-webhook-secret-key')
    .update(JSON.stringify(payload))
    .digest('hex');

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);

  assert.equal(response.body.new_status,'pending' )
  assert.equal(response.status, 200);
})

test('POST/api/webhooks/payment-status webhook request with invalid signature', async ()=> {
  const payload = {
    payment_id: '1',
    status: 'pending',
    event_id: 'test124'
  };

  const signature = crypto
    .createHmac('sha256', 'test-webhook-secret-key-fake')
    .update(JSON.stringify(payload))
    .digest('hex');

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);

  assert.equal(response.body.error,'Invalid signature')
  assert.equal(response.status, 401);
})


test('POST/api/webhooks/payment-status restrict same event to change payemnt status',async () =>{
   const payload = {
    payment_id: '1',
    status: 'completed',
    event_id: 'test123'//event already exists db.processed_webhook
  };

  const signature = crypto
    .createHmac('sha256', 'test-webhook-secret-key')
    .update(JSON.stringify(payload))
    .digest('hex');

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);

  assert.equal(response.body.message, 'Already processed')
  assert.equal(response.status, 200);
})

test('POST/api/webhooks/payment-status allow valid event to change payemnt status',async () =>{
   const payload = {
    payment_id: '1',
    status: 'completed',
    event_id: 'test125'
  };

  const signature = crypto
    .createHmac('sha256', 'test-webhook-secret-key')
    .update(JSON.stringify(payload))
    .digest('hex');

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', signature)
    .send(payload);

  assert.equal(response.body.new_status,'completed')
  assert.equal(response.status, 200);
})