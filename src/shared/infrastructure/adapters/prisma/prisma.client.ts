// src/shared/infrastructure/adapters/prisma/prisma.client.ts
import { PrismaClient } from '@prisma/client';
import { config } from '../../../config/environment';
import { databaseConfig } from '../../../config/database';

class PrismaClientSingleton {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        // Simplificar logging para evitar problemas de tipos
        log: config.isDevelopment ? ['error', 'warn'] : ['error'],
        
        datasources: {
          db: {
            url: databaseConfig.url
          }
        }
      });

      // Eventos de logging simplificados (solo error en desarrollo)
      if (config.isDevelopment) {
        PrismaClientSingleton.instance.$on('error' as never, (e: any) => {
          console.error('❌ Prisma error:', e);
        });
      }

      // Conectar automáticamente
      PrismaClientSingleton.instance.$connect()
        .then(() => {
          console.log('✅ Database connected successfully');
        })
        .catch((error: unknown) => {
          console.error('❌ Database connection failed:', error);
          process.exit(1);
        });
    }

    return PrismaClientSingleton.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      console.log('👋 Database disconnected');
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();

// Manejo de cierre graceful
process.on('beforeExit', async () => {
  await PrismaClientSingleton.disconnect();
});

process.on('SIGINT', async () => {
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});