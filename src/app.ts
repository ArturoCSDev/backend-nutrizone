// Backend: src/app.ts - Versión con DEBUG intensivo
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Middleware compartido
import { rateLimitMiddleware } from './shared/infrastructure/middleware/rate-limit.middleware';
import { errorHandlerMiddleware } from './shared/infrastructure/middleware/error-handler.middleware';

// Rutas
import { routes } from './shared/routes';

// Config y utils
import { appConfig } from './shared/config/app.config';
import { logger } from './shared/infrastructure/utils/logger.util';

const app = express();

// =============================================
// CORS ULTRA PERMISIVO PARA DEBUG
// =============================================

// ✅ CORS más agresivo para debugging
const corsOptions = {
  origin: true, // ✅ Permite CUALQUIER origin temporalmente
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['*'], // ✅ Permite CUALQUIER header
  exposedHeaders: ['Authorization'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Manejo manual y explícito de OPTIONS
app.use('*', (req, res, next) => {
  console.log(`📋 ${req.method} ${req.originalUrl} from ${req.get('Origin')}`);
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS preflight request');
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control');
    res.header('Access-Control-Max-Age', '1728000');
    return res.status(200).end();
  }
  next();
});

// =============================================
// SECURITY MIDDLEWARE (RELAJADO)
// =============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting DESHABILITADO para debug
// if (appConfig.security.rateLimit) {
//   app.use(rateLimitMiddleware);
// }

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
// LOGGING INTENSIVO
// =============================================

app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.get('Origin'));
  console.log('User-Agent:', req.get('User-Agent'));
  next();
});

app.use(morgan('combined'));

// =============================================
// HEALTH CHECK CON CORS INFO
// =============================================

app.get('/health', (req, res) => {
  console.log('🏥 Health check from:', req.get('Origin'));
  res.status(200).json({
    status: 'OK',
    message: 'Nutrition API is healthy',
    timestamp: new Date().toISOString(),
    environment: appConfig.environment,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    cors: {
      origins: appConfig.corsOrigins,
      requestOrigin: req.get('Origin'),
      development: appConfig.environment === 'development'
    },
    headers: req.headers
  });
});

// ✅ Endpoint específico para test CORS
app.all('/cors-test', (req, res) => {
  console.log('🧪 CORS Test endpoint hit');
  res.status(200).json({
    message: 'CORS is working!',
    method: req.method,
    origin: req.get('Origin'),
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🥤 Welcome to Nutrition API',
    version: '1.0.0',
    docs: '/health',
    corsTest: '/cors-test',
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

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log('Available routes: /, /health, /cors-test, /api/v1/*');
  
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: ['/', '/health', '/cors-test', '/api/v1/*']
  });
});

// Error handling middleware
app.use(errorHandlerMiddleware);

export default app;