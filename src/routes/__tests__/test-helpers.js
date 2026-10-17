import request from 'supertest';
import app from '../../server.js';

export async function registerMerchant() {
  const email = `qa-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const response = await request(app).post('/api/auth/register').send({
    email,
    password: 'SecurePass123!',
    business_name: 'QA Test Merchant'
  });
  return { ...response.body, email };
}

export async function createPayment(token, overrides = {}) {
  return request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 25.5,
      currency: 'EUR',
      customer_email: 'customer@example.com',
      ...overrides
    });
}
