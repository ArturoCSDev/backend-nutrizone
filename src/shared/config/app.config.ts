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
  
  // CORS
  corsOrigins: config.isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']
    : ['https://frontend-nitruzone-dcwsec8jt-arturocsdevs-projects.vercel.app'], // Agregar dominios de producción aquí
  
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