// Express application setup is kept separate from server startup
// so the app can be imported directly into tests without starting
// an HTTP listener or opening a port.


import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import tableOrderRoutes from './routes/table-order.routes.js';
import einvoiceRoutes from './routes/einvoice.routes.js';

export const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
app.get("/", (req, res) => {
  res.json({
    message: "EU Pay QA Test API",
    version: "1.0.0",
    features: [
      "🔐 Authentication (JWT)",
      "💳 Payment Processing",
      "🪝 Webhook Handling",
      "🍽️ Table Orders (Socket.IO)",
      "📄 E-Invoicing",
    ],
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/payments",
      "POST /api/payments",
      "GET /api/payments/:id",
      "POST /api/webhooks/payment-status",
      "POST /api/webhooks/e-invoice",
      "GET /api/table-orders",
      "POST /api/table-orders",
      "PATCH /api/table-orders/:id/status",
      "POST /api/einvoice/submit",
      "GET /api/einvoice/status/:invoice_id",
    ],
    socket_events: [
      "join_merchant",
      "join_table",
      "new_order",
      "order_status_changed",
    ],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/table-orders", tableOrderRoutes);
app.use("/api/einvoice", einvoiceRoutes);

//404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});