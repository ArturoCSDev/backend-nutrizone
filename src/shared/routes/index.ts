import { Router } from 'express';
import { logger } from '../infrastructure/utils/logger.util';

// Importar rutas de cada contexto
import { authRoutes } from '../../contexts/auth/infrastructure/controllers/auth.routes';
import { productsRoutes } from '../../contexts/products/infrastructure/controllers/product.routes';
import { nutritionPlansRoutes } from '../../contexts/nutrition-plans/infrastructure/controllers/nutrition-plans.routes';
import { mcpRecommendationRoutes } from '../../contexts/nutrition-plans/infrastructure/controllers/mcp-recommendation.routes';
import { advancedProductSearchRoutes } from '../../contexts/products/infrastructure/controllers/advanced-product-search.routes';
import { asesoriaCompletaRoutes } from '../../contexts/nutrition-plans/infrastructure/controllers/asesoria.routes';

const router = Router();

// Health check global
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================
// REGISTRAR RUTAS DE CONTEXTOS
// =============================================

// Autenticación
router.use('/auth', authRoutes);

// Productos (CRUD básico) - prefijo /inventory
router.use('/inventory', productsRoutes);

// Productos (búsqueda avanzada) - prefijo /products  
router.use('/products', advancedProductSearchRoutes);

// Planes nutricionales (CRUD básico + controles físicos)
router.use('/nutrition-plans', nutritionPlansRoutes);

// Asesoría completa (análisis 360° de clientes)
router.use('/nutrition-plans', asesoriaCompletaRoutes);

router.use('/mcp', mcpRecommendationRoutes);

// Ruta de ejemplo para probar
router.get('/test', (req, res) => {
  logger.info('Test endpoint accessed');
  res.json({
    status: 'success',
    message: 'API is working correctly!',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// RUTA DE DOCUMENTACIÓN DE API COMPLETA
// =============================================

router.get('/api-docs', (req, res) => {
  const documentation = {
    service: 'NutriZone API',
    version: '2.0',
    description: 'API completa para gestión nutricional y planes personalizados',
    lastUpdated: new Date().toISOString(),
    
    endpoints: {
      auth: {
        'POST /auth/login': 'Iniciar sesión',
        'POST /auth/register/client': 'Registrar cliente',
        'POST /auth/register/admin': 'Registrar administrador',
        'GET /auth/users/clients': 'Listar clientes',
        'GET /auth/users/admins': 'Listar administradores'
      },
      
      inventory: {
        'GET /inventory/categorias': 'Listar categorías',
        'GET /inventory/sabores': 'Listar sabores',
        'GET /inventory/tamanos': 'Listar tamaños',
        'GET /inventory/productos': 'Listar productos (básico)',
        'POST /inventory/productos': 'Crear producto (Admin)',
        'PUT /inventory/productos/:id': 'Actualizar producto (Admin)',
        'DELETE /inventory/productos/:id': 'Eliminar producto (Admin)'
      },
      
      products: {
        'GET /products/search/advanced': 'Búsqueda avanzada con filtros múltiples',
        'GET /products/search/quick': 'Búsqueda rápida para autocompletar',
        'GET /products/search/personalized/:clienteId': 'Búsqueda personalizada',
        'GET /products/search/filters': 'Obtener filtros disponibles',
        'GET /products/search/trending': 'Productos en tendencia',
        'GET /products/search/health': 'Health check de búsqueda'
      },
      
      nutritionPlans: {
        'POST /nutrition-plans/plan': 'Crear plan nutricional',
        'GET /nutrition-plans/plan/:id': 'Obtener plan específico',
        'GET /nutrition-plans/cliente/:clienteId/planes': 'Planes por cliente',
        'GET /nutrition-plans/cliente/:clienteId/plan-activo': 'Plan activo del cliente',
        'POST /nutrition-plans/control-fisico': 'Registrar control físico',
        'GET /nutrition-plans/control-fisico': 'Listar controles físicos',
        'PUT /nutrition-plans/control-fisico/:id': 'Actualizar control físico',
        'DELETE /nutrition-plans/control-fisico/:id': 'Eliminar control físico',
        'GET /nutrition-plans/health': 'Health check de nutrition plans'
      },
      
      asesoria: {
        'GET /nutrition-plans/asesoria/:clienteId': 'Asesoría completa (vista 360°)',
        'GET /nutrition-plans/asesoria/:clienteId/resumen': 'Resumen de asesoría',
        'GET /nutrition-plans/asesoria/:clienteId/alertas': 'Solo alertas',
        'GET /nutrition-plans/asesoria/:clienteId/estadisticas': 'Solo estadísticas',
        'GET /nutrition-plans/asesoria/health': 'Health check de asesoría'
      },
      
      mcp: {
        'POST /mcp/': 'Crear recomendaciones con IA (MCP)',
        'GET /mcp/health': 'Health check del servidor MCP'
      }
    },
    
    routeStructure: {
      '/auth/*': 'Autenticación y gestión de usuarios',
      '/inventory/*': 'CRUD básico de productos y categorías',
      '/products/*': 'Búsqueda avanzada y recomendaciones',
      '/nutrition-plans/*': 'Planes nutricionales, controles físicos y asesoría',
      '/mcp/*': 'Inteligencia artificial para recomendaciones'
    },
    
    notes: [
      'Las rutas /inventory/* son para CRUD básico',
      'Las rutas /products/* son para búsqueda avanzada',
      'Las rutas /nutrition-plans/* incluyen tanto planes básicos como asesoría completa',
      'Las rutas /mcp/* requieren servidor MCP activo'
    ]
  };

  res.status(200).json({
    status: 'success',
    message: 'Documentación de NutriZone API',
    data: documentation,
    timestamp: new Date().toISOString()
  });
});

export { router as routes };
