// src/server.ts - SOLO para desarrollo local
import 'reflect-metadata';
import app from './app';
import { config } from './shared/config/environment';
import { logger } from './shared/infrastructure/utils/logger.util';

const PORT = config.PORT;

async function startServer() {
  try {
    app.listen(PORT, () => {
      logger.success(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${config.NODE_ENV}`);
      logger.info(`🗄️  Database: Connected`);
      logger.info(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      
      if (config.isDevelopment) {
        logger.info(`📋 Health Check: http://localhost:${PORT}/health`);
        logger.info(`🧪 CORS Test: http://localhost:${PORT}/cors-test`);
        logger.info(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`👋 ${signal} received, shutting down gracefully`);
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Failed to start server:', { error: errorMessage });
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}