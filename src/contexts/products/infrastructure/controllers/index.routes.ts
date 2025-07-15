import { Router } from 'express';

// Importar las rutas existentes
import { productsRoutes } from './product.routes';

// Importar las nuevas rutas avanzadas
import { advancedProductSearchRoutes } from './advanced-product-search.routes';

const router = Router();

// ==========================================
// INTEGRACIÓN DE RUTAS
// ==========================================

/**
 * ESTRUCTURA DE RUTAS:
 * 
 * /products/categorias/*          -> Rutas básicas de categorías
 * /products/sabores/*             -> Rutas básicas de sabores  
 * /products/tamanos/*             -> Rutas básicas de tamaños
 * /products/productos/*           -> Rutas básicas de productos
 * /products/search/*              -> Rutas avanzadas de búsqueda (NUEVAS)
 */

// Rutas básicas existentes (CRUD tradicional)
router.use('/', productsRoutes);

// Rutas avanzadas de búsqueda (NUEVAS)
router.use('/', advancedProductSearchRoutes);

// ==========================================
// RUTA DE DOCUMENTACIÓN DE API
// ==========================================

/**
 * @route GET /products/api-docs
 * @desc Documentación de todas las rutas de productos disponibles
 * @access Public
 */
router.get('/api-docs', (req, res) => {
  const documentation = {
    service: 'Products API',
    version: '2.0',
    description: 'API completa para gestión y búsqueda de productos nutricionales',
    lastUpdated: new Date().toISOString(),
    
    endpoints: {
      // Rutas básicas existentes
      categorias: {
        'GET /products/categorias': 'Listar categorías con filtros',
        'GET /products/categorias/:id': 'Obtener categoría por ID',
        'GET /products/categorias/tipo/:tipoProducto': 'Categorías por tipo'
      },
      
      sabores: {
        'GET /products/sabores': 'Listar sabores con filtros',
        'GET /products/sabores/:id': 'Obtener sabor por ID',
        'POST /products/sabores': 'Crear nuevo sabor (Admin)',
        'PUT /products/sabores/:id': 'Actualizar sabor (Admin)',
        'DELETE /products/sabores/:id': 'Eliminar sabor (Admin)'
      },
      
      tamanos: {
        'GET /products/tamanos': 'Listar tamaños con filtros',
        'GET /products/tamanos/:id': 'Obtener tamaño por ID',
        'GET /products/tamanos/volumen/:min/:max': 'Tamaños por rango de volumen'
      },
      
      productos: {
        'GET /products/productos': 'Listar productos con filtros básicos',
        'GET /products/productos/:id': 'Obtener producto por ID',
        'POST /products/productos': 'Crear nuevo producto (Admin)',
        'PUT /products/productos/:id': 'Actualizar producto (Admin)',
        'DELETE /products/productos/:id': 'Eliminar producto (Admin)'
      },
      
      // Nuevas rutas avanzadas
      busquedaAvanzada: {
        'GET /products/search/advanced': 'Búsqueda avanzada con filtros múltiples',
        'GET /products/search/filters': 'Obtener filtros disponibles',
        'GET /products/search/quick': 'Búsqueda rápida para autocompletar',
        'GET /products/search/personalized/:clienteId': 'Búsqueda personalizada',
        'GET /products/search/trending': 'Productos en tendencia',
        'GET /products/search/recommendations/:clienteId': 'Recomendaciones para cliente',
        'GET /products/search/health': 'Health check de búsqueda'
      }
    },
    
    features: {
      crud: {
        description: 'Operaciones CRUD básicas',
        entities: ['categorias', 'sabores', 'tamanos', 'productos'],
        permissions: 'Lectura: Público | Escritura: Admin'
      },
      
      busquedaBasica: {
        description: 'Búsqueda con filtros simples',
        filters: ['nombre', 'categoria', 'sabor', 'precio', 'momento'],
        endpoint: '/products/productos'
      },
      
      busquedaAvanzada: {
        description: 'Búsqueda con filtros múltiples y características avanzadas',
        filters: [
          'texto (nombre, descripción, ingredientes)',
          'categorización (categorías, sabores, tamaños, tipo)',
          'precio (rango mín/máx)',
          'nutrición (proteína, calorías)',
          'momentos del día',
          'etiquetas e ingredientes',
          'exclusión de alérgenos',
          'características (imagen, completo, alta proteína, bajas calorías)',
          'preferencias de cliente (favoritos, compatibilidad)'
        ],
        sorting: ['nombre', 'precio', 'proteina', 'calorias', 'fechaCreacion'],
        pagination: 'Soporte completo con limit/offset',
        relations: 'Inclusión opcional de categoría, sabor, tamaño',
        statistics: 'Estadísticas de búsqueda opcionales'
      },
      
      personalizacion: {
        description: 'Funciones específicas para clientes',
        features: [
          'Productos favoritos',
          'Exclusión automática de alérgenos',
          'Recomendaciones basadas en preferencias',
          'Compatibilidad con objetivos nutricionales'
        ]
      }
    },
    
    examples: {
      busquedaBasica: '/products/productos?nombre=proteina&categoriaId=abc123',
      busquedaAvanzada: '/products/search/advanced?search=proteina&altaProteina=true&precioMax=50&includeCategoria=true&limit=10',
      busquedaRapida: '/products/search/quick?q=bati',
      busquedaPersonalizada: '/products/search/personalized/cliente123?soloFavoritos=true&limit=20',
      recomendaciones: '/products/search/recommendations/cliente123'
    },
    
    migration: {
      from: 'v1.0 - Búsqueda básica únicamente',
      to: 'v2.0 - Búsqueda básica + avanzada + personalización',
      compatibility: 'Todas las rutas v1.0 siguen funcionando',
      recommendations: [
        'Usar /search/advanced para nuevas implementaciones',
        'Migrar gradualmente desde /productos a /search/advanced',
        'Implementar /search/personalized para usuarios autenticados'
      ]
    }
  };

  res.status(200).json({
    status: 'success',
    message: 'Documentación de Products API',
    data: documentation,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// RUTA DE ESTADÍSTICAS GENERALES
// ==========================================

/**
 * @route GET /products/stats
 * @desc Estadísticas generales de productos
 * @access Public
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Aquí podrías implementar estadísticas reales
    // Por ahora, datos simulados
    const stats = {
      productos: {
        total: 150,
        conImagen: 120,
        completos: 100,
        altaProteina: 45,
        bajasCaloria: 30
      },
      categorias: {
        total: 8,
        batidos: 5,
        refrescos: 2,
        waffles: 1
      },
      sabores: {
        total: 25,
        populares: ['Vainilla', 'Chocolate', 'Fresa', 'Cookies & Cream']
      },
      tamanos: {
        total: 6,
        pequeno: 2,
        mediano: 3,
        grande: 1
      },
      busquedas: {
        busquedaBasicaUsage: '60%',
        busquedaAvanzadaUsage: '35%',
        busquedaPersonalizadaUsage: '5%',
        filtrosMasUsados: ['precio', 'categoria', 'altaProteina', 'nombre']
      },
      rendimiento: {
        avgResponseTime: '245ms',
        cachedResults: '78%',
        searchAccuracy: '94%'
      }
    };

    res.status(200).json({
      status: 'success',
      message: 'Estadísticas de productos obtenidas exitosamente',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export { router as allProductsRoutes };
