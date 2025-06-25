import rateLimit from 'express-rate-limit';
import { appConfig } from '../../config/app.config';

export const rateLimitMiddleware = rateLimit({
  windowMs: appConfig.rateLimiting.windowMs,
  max: appConfig.rateLimiting.maxRequests,
  message: {
    status: 'error',
    message: appConfig.rateLimiting.message,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip para health checks y desarrollo
    return req.url === '/health' || req.url.includes('/api-docs');
  }
});
