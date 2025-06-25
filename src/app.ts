import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Middleware compartido
import { corsMiddleware } from './shared/infrastructure/middleware/cors.middleware';
import { rateLimitMiddleware } from './shared/infrastructure/middleware/rate-limit.middleware';
import { errorHandlerMiddleware } from './shared/infrastructure/middleware/error-handler.middleware';

// Rutas
import { routes } from './shared/routes';

// Config y utils
import { appConfig } from './shared/config/app.config';
import { logger } from './shared/infrastructure/utils/logger.util';

const app = express();

// =============================================
// SECURITY MIDDLEWARE
// =============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(corsMiddleware);

// Rate limiting (solo en producción)
if (appConfig.security.rateLimit) {
  app.use(rateLimitMiddleware);
}

// =============================================
// REQUEST PARSING
// =============================================

app.use(express.json({ 
  limit: appConfig.jsonLimit,
  type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: appConfig.urlEncodedLimit 
}));

// =============================================
// LOGGING
// =============================================

// Morgan logging con diferentes formatos según ambiente
const morganFormat = appConfig.environment === 'production' 
  ? 'combined' 
  : 'dev';

app.use(morgan(morganFormat, {
  stream: { 
    write: (message: string) => logger.info(message.trim()) 
  },
  skip: (req) => {
    // Skip logging para health checks en producción
    return appConfig.environment === 'production' && req.url === '/api/v1/health';
  }
}));

// =============================================
// HEALTH CHECK
// =============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Nutrition API is healthy',
    timestamp: new Date().toISOString(),
    environment: appConfig.environment,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🥤 Welcome to Nutrition API',
    version: '1.0.0',
    docs: '/api/v1/health',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// API ROUTES
// =============================================

app.use(appConfig.apiPrefix, routes);

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler para rutas no encontradas
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (debe ser el último)
app.use(errorHandlerMiddleware);

export default app;
