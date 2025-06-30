// src/app.ts - Configuración CORS CORREGIDA
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
// CORS - CONFIGURACIÓN CORREGIDA
// =============================================

// ✅ Configuración específica y explícita
const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
};

// ✅ Aplicar CORS ANTES que cualquier otra cosa
app.use(cors(corsOptions));

// ✅ Manejo explícito de preflight OPTIONS
app.options('*', cors(corsOptions));

// =============================================
// MIDDLEWARE DE DEBUG
// =============================================

// Debug middleware para ver qué está pasando
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl}`);
  console.log('🌐 Origin:', req.get('Origin'));
  console.log('📋 Headers:', req.headers);
  
  // Asegurar headers CORS en cada respuesta
  if (req.get('Origin')) {
    res.header('Access-Control-Allow-Origin', req.get('Origin'));
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// =============================================
// SECURITY MIDDLEWARE (DESPUÉS DE CORS)
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

// ✅ Endpoint específico para probar CORS
app.get('/cors-test', (req, res) => {
  console.log('🧪 CORS Test endpoint hit from:', req.get('Origin'));
  res.status(200).json({
    message: 'CORS is working!',
    method: req.method,
    origin: req.get('Origin'),
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// ✅ Endpoint POST para probar CORS con datos
app.post('/cors-test', (req, res) => {
  console.log('🧪 POST CORS Test from:', req.get('Origin'));
  res.status(200).json({
    message: 'POST CORS is working!',
    data: req.body,
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