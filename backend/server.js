import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isConnected, dbStatus } from './db/database.js';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import requestRoutes from './routes/requests.js';
import workerRoutes from './routes/workers.js';
import assetRoutes from './routes/assets.js';
import budgetRoutes from './routes/budget.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB with safe fallback
await connectDB();

// CORS configuration (Requirement 24)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', '*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));

// Request logging middleware (sanitized - no credentials logged)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root & API Base route
app.get(['/', '/api'], (req, res) => {
  res.json({
    name: 'HostelOps Asset Management API',
    status: 'running',
    database: dbStatus.connected ? `Connected (${dbStatus.connectionType})` : 'Disconnected',
    dbDetails: {
      connected: dbStatus.connected,
      connectionType: dbStatus.connectionType,
      host: dbStatus.host,
      database: dbStatus.database,
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      assets: '/api/assets',
      categories: '/api/assets/categories/all',
      allocation: '/api/assets/allocate',
      transfers: '/api/assets/transfers/all',
      maintenance: '/api/assets/maintenance/all',
      audits: '/api/assets/audits/all',
      disposals: '/api/assets/disposal/all',
      requests: '/api/assets/requests/all',
      reportsSummary: '/api/assets/reports/summary',
      analytics: '/api/analytics/overview',
      notifications: '/api/notifications',
      auditLogs: '/api/audit-logs',
      workers: '/api/workers',
    },
  });
});

// Health check endpoint (Requirement 22)
app.get('/api/health', (req, res) => {
  const isHealthy = true;
  const isDbHealthy = dbStatus.connected;

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    status: isHealthy ? 'ok' : 'degraded',
    service: 'HostelOps Backend API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: isDbHealthy ? 'connected' : 'disconnected',
      connected: isDbHealthy,
      connectionType: dbStatus.connectionType,
      host: dbStatus.host,
      name: dbStatus.database,
      lastError: dbStatus.lastError || null,
    },
  });
});

// Mount Routes
app.use('/api', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/workers', workerRoutes);

// Compatibility mount for legacy ticket & staff-request routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/budget', budgetRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
});

// Global error handler (Requirement 25)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Internal Server Error' : err.message || 'An unexpected error occurred.',
    errorCode: err.code || 'SERVER_ERROR',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 HostelOps Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
});

export default app;
