import crypto from 'node:crypto';
import request from 'supertest';
import app from '../../server.js';

export const webhookSecret = 'test-webhook-secret-key';

export function signWebhook(payload) {
  return crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

export async function registerMerchant(label) {
  const response = await request(app).post('/api/auth/register').send({
    email: `${label}-${Date.now()}-${Math.random()}@example.com`,
    password: 'SecurePass123!',
    business_name: 'Test Merchant'
  });

  if (response.status !== 201) {
    throw new Error(`Merchant registration failed: ${response.text}`);
  }

  return response.body.token;
}
