import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { initDatabase } from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'EU Pay QA Test API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/payments',
      'POST /api/payments',
      'GET /api/payments/:id'
    ]
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`✅ EU Pay QA Test API running on http://localhost:${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} for available endpoints`);
});

export default app;
