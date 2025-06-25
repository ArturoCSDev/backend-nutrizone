import cors from 'cors';
import { appConfig } from '../../config/app.config';

const corsOptions: cors.CorsOptions = {
  origin: appConfig.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-id'],
  maxAge: 86400 // 24 horas
};

export const corsMiddleware = cors(corsOptions);
