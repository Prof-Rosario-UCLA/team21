require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cache = require('./services/cache');

// Import security middleware
const {
  generalLimiter,
  authLimiter,
  apiLimiter,
  csrfProtection,
  sanitizeInput,
  helmetMiddleware,
  hppProtection
} = require('./middleware/security');

// Import validation middleware
const {
  validateArticleQuery,
  validateArticleId,
  validateDateParam
} = require('./middleware/validation');

// Import routers
const articlesRouter = require('./routes/articles');
const authRouter = require('./routes/auth');
const securityRouter = require('./routes/security');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

// Security middleware
app.use(helmetMiddleware);
app.use(hppProtection);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-CSRF-Secret']
}));

app.use(cookieParser());

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Input sanitization
app.use(sanitizeInput);

// Request logging with IP
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`${req.method} ${req.path} - IP: ${ip} - ${new Date().toISOString()}`);
  next();
});

// CSRF protection middleware - applied after body parsing
app.use(csrfProtection);

// Routes with specific security measures
app.use('/api/security', securityRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/articles', apiLimiter, articlesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'UCLA Reddit Summarizer API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'UCLA Reddit Summarizer API',
    endpoints: {
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        me: '/api/auth/me'
      },
      articles: {
        list: '/api/articles',
        generate: '/api/articles/generate',
        stats: '/api/articles/system/stats'
      },
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// MongoDB connection
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    
    // Initialize cache
    await cache.connect();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await cache.disconnect();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await cache.disconnect();
  await mongoose.connection.close();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app; 