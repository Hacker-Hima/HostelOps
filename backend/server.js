const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const User = require('./models/User');
const seedAll = require('./seed/seedData');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(async () => {
  // Check if DB is empty, auto-seed if needed
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[System]: Database is empty. Running initial auto-seed...');
      await seedAll();
    }
  } catch (err) {
    console.error('[Auto-Seed Warning]:', err.message);
  }
});

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Hostel Asset Management System API',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/damage', require('./routes/damageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Hostel Asset Management Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Error]: ${err.message}`);
  // Keep server alive or log
});
