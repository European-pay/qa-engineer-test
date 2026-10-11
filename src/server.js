// Import the configured Express app and attach it to the HTTP server.
// Server startup and Socket.IO initialization remain separate from
// the app configuration to make API routes easier to test with Supertest.

import { createServer } from "http";
import { Server } from "socket.io";
import { app } from './app.js';
import { initDatabase } from "./db/database.js";


console.log()
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("📱 Client connected:", socket.id);

  // Join merchant room for real-time updates
  socket.on("join_merchant", (merchantId) => {
    socket.join(`merchant_${merchantId}`);
  });

  // Join table room for order updates
  socket.on("join_table", (tableNumber) => {
    socket.join(`table_${tableNumber}`);
    console.log(`Joined table ${tableNumber} room`);
  });

  socket.on("disconnect", () => {
    console.log("📱 Client disconnected:", socket.id);
  });
});

// Make io accessible in routes (for emitting events)
app.set("io", io);

httpServer.listen(PORT, () => {
  console.log(`✅ EU Pay QA Test API running on http://localhost:${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} for available endpoints`);
  console.log(`🔌 Socket.IO ready for real-time updates`);
});

export default app;
