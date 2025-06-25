import 'reflect-metadata';
import app from './app';
import { config } from './shared/config/environment';
import { logger } from './shared/infrastructure/utils/logger.util';

const PORT = config.PORT;

async function startServer() {
  try {
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.success(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${config.NODE_ENV}`);
      logger.info(`🗄️  Database: Connected`);
      logger.info(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      
      // URLs útiles para desarrollo
      if (config.isDevelopment) {
        logger.info(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
        logger.info(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
        logger.info(`📝 Register Client: POST http://localhost:${PORT}/api/v1/auth/register/client`);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      logger.info(`👋 ${signal} received, shutting down gracefully`);
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // ← FIX: Argumentos correctos para logger.error
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection:', { 
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise)
      });
      process.exit(1);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Failed to start server:', { error: errorMessage });
    process.exit(1);
  }
}

// Start the server
startServer();
