require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development, or if CLIENT_URL matches, or Vercel/Render preview domains
      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      // Default fallback allows origin dynamically for seamless multi-environment deployments
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check (always responsive, diagnostic)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected';
    } else {
      await connectDB();
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Library Management System API',
    database: dbStatus,
    mongodb_configured: Boolean(process.env.MONGODB_URI),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database connection & auto-seed middleware for API routes
app.use(async (req, res, next) => {
  // Pass through if not an API route or already handled
  if (!req.path.startsWith('/api') || req.path === '/api/health') {
    return next();
  }

  try {
    await connectDB();

    // Auto-seed empty database so demo accounts exist on fresh Vercel/Atlas deployments
    try {
      const User = require('./models/User');
      const count = await User.estimatedDocumentCount();
      if (count === 0) {
        console.log('[AutoSeed] Empty database detected. Seeding sample accounts and catalog...');
        const seedDatabase = require('./seeds/seedData');
        await seedDatabase(false);
        console.log('[AutoSeed] Initial database seed completed.');
      }
    } catch (seedErr) {
      console.warn('[AutoSeed Warning]:', seedErr.message);
    }

    next();
  } catch (err) {
    console.error('[Database Connection Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: `Database Connection Failed: ${err.message}`,
      hint: !process.env.MONGODB_URI
        ? 'MONGODB_URI is not set. In your Render / Vercel dashboard, configure MONGODB_URI with your MongoDB Atlas connection string.'
        : 'Please verify that your MongoDB Atlas IP Access List allows connections from anywhere (0.0.0.0/0).'
    });
  }
});

// Manual database seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await connectDB();
    const seedDatabase = require('./seeds/seedData');
    await seedDatabase(false);
    res.status(200).json({
      success: true,
      message: 'Database seeded successfully with sample accounts and books.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to seed database: ${err.message}`
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Catch-all 404 for unhandled API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only listen directly when running in a standalone process (not serverless module export)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Library Management System Server Running`);
    console.log(` Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(` API URL: http://localhost:${PORT}/api`);
    console.log(`=================================================`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
