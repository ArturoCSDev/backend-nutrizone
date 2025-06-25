// src/app.ts - SIN app.listen() para Vercel
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Middleware compartido
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

// ✅ Manejo manual de OPTIONS
app.use('*', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS handled in Express');
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
// SECURITY MIDDLEWARE
// =============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

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

app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl} from ${req.get('Origin')}`);
  next();
});

// Solo logging básico en producción
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// =============================================
// HEALTH CHECK
// =============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Nutrition API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/cors-test', (req, res) => {
  console.log('🧪 CORS Test endpoint hit from:', req.get('Origin'));
  res.status(200).json({
    message: 'CORS is working!',
    method: req.method,
    origin: req.get('Origin'),
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

app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandlerMiddleware);

export default app;