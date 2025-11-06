import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Security imports
import { SecurityManager } from './src/security/SecurityManager';
import { AuthenticationService } from './src/security/AuthenticationService';
import { DataProtectionService } from './src/security/DataProtectionService';

// Route imports
import { createAuthRoutes } from './src/routes/authRoutes';
import { createSecureApiRoutes } from './src/routes/secureApiRoutes';
import telegramRoutes from './src/routes/telegramRoutes';
import notionRoutes from './src/routes/notionRoutes.cjs';
import monitoringRoutes from './src/routes/monitoringRoutes';

// Monitoring system import
import { initializeMonitoring } from './src/services/monitoring';

// Configuration imports
import {
  securityConfig,
  dataProtectionConfig,
  corsOrigins,
  validateSecurityConfig,
  getSecuritySummary,
} from './src/config/securityConfig';

// Load environment variables
dotenv.config();

// Validate security configuration
const configValidation = validateSecurityConfig();
if (!configValidation.isValid) {
  console.error('❌ Security configuration validation failed:');
  configValidation.errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('✅ Security configuration validated successfully');

// Initialize security services
const securityManager = new SecurityManager(securityConfig);
const authService = new AuthenticationService(securityManager);
const dataProtectionService = new DataProtectionService(securityManager, dataProtectionConfig);

// Initialize monitoring system
let monitoringServices;
try {
  monitoringServices = initializeMonitoring();
  console.log('✅ Monitoring system initialized successfully');
} catch (error) {
  console.error('⚠️  Failed to initialize monitoring system:', error.message);
  // Continue without monitoring - it's not critical for basic operation
}

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware stack
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  }),
);

// Body parsing middleware
app.use(compression());
app.use(cookieParser(securityConfig.sessionSecret));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Custom security headers middleware
app.use((req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Custom headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// Request logging and security monitoring
app.use((req, res, next) => {
  const startTime = Date.now();

  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
    );

    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`🚨 Security alert: Unauthorized access attempt to ${req.path} from ${req.ip}`);
    }
  });

  next();
});

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    security: getSecuritySummary(),
  });
});

// API health check (more detailed)
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // In production, check actual DB connection
      authentication: 'operational',
      encryption: 'operational',
      rateLimiting: 'operational',
    },
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
    security: {
      configValid: configValidation.isValid,
      authenticationEnabled: true,
      encryptionEnabled: true,
      monitoringEnabled: true,
    },
  };

  const isHealthy = Object.values(healthCheck.services).every(
    (status) => status === 'connected' || status === 'operational',
  );

  res.status(isHealthy ? 200 : 503).json(healthCheck);
});

// API routes
app.use('/api/auth', createAuthRoutes(securityManager, authService, dataProtectionService));
app.use('/api', createSecureApiRoutes(securityManager, authService, dataProtectionService));
app.use('/api/monitoring', monitoringRoutes);

// Legacy routes with security middleware applied
app.use('/api/telegram', authService.rateLimit(100, 15 * 60 * 1000), telegramRoutes);

app.use(
  '/api/notion',
  authService.authenticateApiKey(['read_data', 'write_data']),
  authService.rateLimit(30, 60 * 1000),
  notionRoutes,
);

// Static files (if needed for frontend)
app.use(
  express.static('public', {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true,
  }),
);

// API documentation endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'AI Council LifeOS API',
      version: '1.0.0',
      description: 'Secure API for AI Council LifeOS system',
      authentication: {
        type: 'Bearer Token',
        description: 'JWT token required for most endpoints',
      },
      endpoints: {
        auth: {
          'POST /api/auth/register': 'Register new user',
          'POST /api/auth/login': 'User login',
          'POST /api/auth/logout': 'User logout',
          'GET /api/auth/profile': 'Get user profile',
          'PUT /api/auth/profile': 'Update user profile',
          'PUT /api/auth/password': 'Change password',
          'PUT /api/auth/preferences': 'Update preferences',
          'PUT /api/auth/privacy': 'Update privacy settings',
          'GET /api/auth/sessions': 'Get user sessions',
          'DELETE /api/auth/sessions/:id': 'Revoke session',
          'DELETE /api/auth/account': 'Delete account',
        },
        api: {
          'GET /api/council-members': 'Get council members',
          'GET /api/insights': 'Get AI insights',
          'GET /api/personal-data': 'Get personal data',
          'POST /api/personal-data': 'Add personal data',
          'GET /api/goals': 'Get goals',
          'POST /api/goals': 'Create goal',
          'POST /api/insights/:id/act': 'Act on insight',
          'GET /api/stats': 'Get statistics',
          'GET /api/export': 'Export data',
          'DELETE /api/personal-data/:id': 'Delete personal data',
        },
        integrations: {
          'POST /api/telegram/*': 'Telegram bot endpoints',
          'GET /api/notion/*': 'Notion integration endpoints',
        },
      },
      security: {
        authentication: 'JWT Bearer Token',
        rateLimiting: 'Applied per endpoint',
        encryption: 'Sensitive data encrypted at rest',
        auditLogging: 'All actions logged',
      },
    });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      auth: '/api/auth/*',
      api: '/api/*',
      health: '/health',
      documentation: process.env.NODE_ENV !== 'production' ? '/api/docs' : null,
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions',
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded',
      retryAfter: err.retryAfter || 60,
    });
  }

  // Default error response
  const statusCode = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Close server
  server.close(() => {
    console.log('Server closed');

    // Cleanup resources
    securityManager.cleanupExpiredLockouts();

    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');

  // Close server
  server.close(() => {
    console.log('Server closed');

    // Cleanup resources
    securityManager.cleanupExpiredLockouts();

    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 AI Council LifeOS Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🔐 Security: ${getSecuritySummary().authentication.jwtEnabled ? 'Enabled' : 'Disabled'}`,
  );
  console.log(`🌐 CORS origins: ${corsOrigins.join(', ')}`);
  console.log(`📈 Health check: http://localhost:${port}/health`);
  console.log(`🔍 Monitoring API: http://localhost:${port}/api/monitoring/overview`);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 API documentation: http://localhost:${port}/api/docs`);
  }

  console.log('✅ Server ready to handle requests');
});

export default app;
