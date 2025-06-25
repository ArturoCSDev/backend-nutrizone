// Backend: src/shared/config/app.config.ts
import { config } from './environment';

export const appConfig = {
  // Server
  port: config.PORT,
  environment: config.NODE_ENV,
  
  // API
  apiPrefix: '/api/v1',
  
  // Request limits
  jsonLimit: '10mb',
  urlEncodedLimit: '10mb',
  
  // CORS - CORREGIDO con la URL real del frontend
  corsOrigins: config.isDevelopment 
    ? [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://localhost:4173'
      ]
    : [
        'https://frontend-nitruzone-dcwsec8jt-arturocsdevs-projects.vercel.app', // ✅ Preview URL
        'https://frontend-nitruzone.vercel.app', // ✅ URL real (con typo corregido)
        'https://frontend-nutrizone.vercel.app', // ✅ Por si cambias la URL
        'https://*.vercel.app' // ✅ Wildcard para cualquier deploy
      ],
  
  // Rate limiting
  rateLimiting: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Security
  security: {
    helmet: true,
    cors: true,
    rateLimit: !config.isDevelopment
  }
};