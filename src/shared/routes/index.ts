import { Router } from 'express';
import { logger } from '../infrastructure/utils/logger.util';

// Importar rutas de cada contexto cuando las crees
import { authRoutes } from '../../contexts/auth/infrastructure/controllers/auth.routes';
import { productsRoutes } from '../../contexts/products/infrastructure/controllers/product.routes';
import { nutritionPlansRoutes } from '../../contexts/nutrition-plans/infrastructure/controllers/nutrition-plans.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Registrar rutas de contextos
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/nutrition-plans', nutritionPlansRoutes);
// router.use('/chat', chatRoutes);

// Ruta de ejemplo para probar
router.get('/test', (req, res) => {
  logger.info('Test endpoint accessed');
  res.json({
    status: 'success',
    message: 'API is working correctly!',
    timestamp: new Date().toISOString()
  });
});

export { router as routes };
