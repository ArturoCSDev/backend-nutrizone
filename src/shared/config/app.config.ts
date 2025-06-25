// src/shared/config/app.config.ts
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
  
  // CORS - CORREGIDO
  corsOrigins: config.isDevelopment 
    ? [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://localhost:4173' // Vite preview
      ]
    : [
        'https://frontend-nitruzone-dcwsec8jt-arturocsdevs-projects.vercel.app',
        'https://frontend-nitruzone.vercel.app', // ❌ Quitada la barra final
        'https://frontend-nutrizone.vercel.app', // ✅ Corregido el typo nitruzone -> nutrizone
        'https://*.vercel.app' // ✅ Wildcard para deployments de preview
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
    rateLimit: !config.isDevelopment // Solo en producción
  }
};