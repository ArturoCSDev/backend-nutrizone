import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  // Server
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '604800',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Helpers
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },
  
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }
};

// Validar variables requeridas
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
