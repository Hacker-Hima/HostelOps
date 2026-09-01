import express from 'express';
import cors from 'cors';
import { initDB } from './db/database.js';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import requestRoutes from './routes/requests.js';
import workerRoutes from './routes/workers.js';
import assetRoutes from './routes/assets.js';
import budgetRoutes from './routes/budget.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Seed initial records
initDB();
console.log('✅ SQLite Database initialized & seeded successfully.');

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HostelOps Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 HostelOps Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
});

export default app;
