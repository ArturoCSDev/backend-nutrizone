// src/shared/infrastructure/middleware/cors.middleware.ts
import cors from 'cors';
import { appConfig } from '../../config/app.config';
import { logger } from '../utils/logger.util';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    // En desarrollo, permitir cualquier localhost
    if (appConfig.environment === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Verificar si el origin está en la lista permitida
    const isAllowed = appConfig.corsOrigins.some(allowedOrigin => {
      // Soporte para wildcards
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      logger.info(`CORS: Allowing origin ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocking origin ${origin}`);
      callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-client-id',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 200
};

export const corsMiddleware = cors(corsOptions);