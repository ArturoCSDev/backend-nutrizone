export const databaseConfig = {
  url: process.env.DATABASE_URL!,
  
  // Configuraciones de conexión
  connectionTimeout: 10000, // 10 segundos
  queryTimeout: 30000, // 30 segundos
  
  // Pool de conexiones (si usaras un pool personalizado)
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 300000
  },
  
  // Configuraciones de desarrollo
  logging: process.env.NODE_ENV === 'development',
  
  // Retry logic
  retryAttempts: 3,
  retryDelay: 1000
};
