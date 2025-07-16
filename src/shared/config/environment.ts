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
  
  // Claude AI
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY!,
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  CLAUDE_MAX_TOKENS: Number(process.env.CLAUDE_MAX_TOKENS) || 4000,
  CLAUDE_TEMPERATURE: Number(process.env.CLAUDE_TEMPERATURE) || 0.7,
  CLAUDE_TIMEOUT: Number(process.env.CLAUDE_TIMEOUT) || 60000, // 60 segundos
  
  // Helpers
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },
  
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }
};

// Validar variables requeridas
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'CLAUDE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
}