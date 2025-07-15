import { NextFunction, Request, Response, Router } from 'express';
import { AdvancedProductSearchController } from './advanced-product-search.controller';
import { AdvancedProductSearchDto } from '../../application/advanced-product-search/advanced-product-search.dto';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

const router = Router();
const advancedSearchController = new AdvancedProductSearchController();

/**
 * @route GET /products/search/advanced
 * @desc Búsqueda avanzada de productos con filtros múltiples
 * @query search - Término de búsqueda (nombre, descripción, ingredientes)
 * @query categoriaIds - Array de IDs de categorías (comma-separated)
 * @query saborIds - Array de IDs de sabores (comma-separated)
 * @query tamanoIds - Array de IDs de tamaños (comma-separated)
 * @query tipoProducto - Tipo de producto (BATIDO, REFRESCO, WAFFLE)
 * @query precioMin - Precio mínimo
 * @query precioMax - Precio máximo
 * @query proteinaMin - Proteína mínima en gramos
 * @query caloriasMin - Calorías mínimas
 * @query caloriasMax - Calorías máximas
 * @query momentosDelDia - Array de momentos del día (comma-separated)
 * @query etiquetas - Array de etiquetas (comma-separated)
 * @query ingredientes - Array de ingredientes que DEBE tener (comma-separated)
 * @query excludeAlergenos - Array de alérgenos a excluir (comma-separated)
 * @query soloConImagen - Solo productos con imagen (true/false)
 * @query soloCompletos - Solo productos completos (true/false)
 * @query altaProteina - Solo productos con alta proteína ≥20g (true/false)
 * @query bajasCaloria - Solo productos con bajas calorías ≤200 (true/false)
 * @query clienteId - ID del cliente para aplicar preferencias
 * @query soloFavoritos - Solo productos favoritos del cliente (true/false)
 * @query sortBy - Campo de ordenamiento (nombre, precio, proteina, calorias, fechaCreacion)
 * @query sortOrder - Orden (asc, desc)
 * @query limit - Límite de resultados (1-100, default: 20)
 * @query offset - Offset para paginación (default: 0)
 * @query includeCategoria - Incluir datos de categoría (true/false)
 * @query includeSabor - Incluir datos de sabor (true/false)
 * @query includeTamano - Incluir datos de tamaño (true/false)
 * @query includeEstadisticas - Incluir estadísticas de búsqueda (true/false)
 * @access Public
 * @example
 * GET /products/search/advanced?search=proteina&altaProteina=true&includeCategoria=true&limit=10
 */
router.get('/search/advanced', 
  // validationMiddleware(AdvancedProductSearchDto), // Para query params es complejo
  advancedSearchController.advancedSearch
);

/**
 * @route GET /products/search/filters
 * @desc Obtener todos los filtros disponibles sin ejecutar búsqueda
 * @access Public
 */
router.get('/search/filters', 
  advancedSearchController.getAvailableFilters
);

/**
 * @route GET /products/search/quick
 * @desc Búsqueda rápida optimizada para autocompletar
 * @query q - Término de búsqueda (mínimo 2 caracteres)
 * @access Public
 * @example
 * GET /products/search/quick?q=prot
 */
router.get('/search/quick', 
  advancedSearchController.quickSearch
);

/**
 * @route GET /products/search/personalized/:clienteId
 * @desc Búsqueda personalizada para un cliente específico
 * @param clienteId - UUID del cliente
 * @query search - Término de búsqueda opcional
 * @query soloFavoritos - Solo favoritos (true/false)
 * @query altaProteina - Solo alta proteína (true/false)
 * @query bajasCaloria - Solo bajas calorías (true/false)
 * @query limit - Límite de resultados (default: 20)
 * @query offset - Offset para paginación (default: 0)
 * @access Private (Cliente/Admin)
 * @example
 * GET /products/search/personalized/uuid-cliente?soloFavoritos=true&limit=10
 */
router.get('/search/personalized/:clienteId', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  advancedSearchController.personalizedSearch
);

/**
 * @route GET /products/search/health
 * @desc Health check del servicio de búsqueda avanzada
 * @access Public
 */
router.get('/search/health', 
  advancedSearchController.healthCheck
);

// ==========================================
// RUTAS ADICIONALES ÚTILES
// ==========================================

/**
 * @route GET /products/search/trending
 * @desc Productos en tendencia (más buscados/recomendados)
 * @access Public
 */
router.get('/search/trending', 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clienteId } = req.params;
      const controller = new AdvancedProductSearchController();
      
      logger.info('Generando recomendaciones para cliente', { clienteId });

      // Obtener diferentes tipos de recomendaciones
      const [favoritosResult, altaProteinaResult, bajasCaloriaResult, compatiblesResult] = await Promise.all([
        // Productos favoritos del cliente
        (controller as any).advancedSearchUseCase.execute({
          clienteId,
          soloFavoritos: true,
          limit: 5,
          includeCategoria: true,
          includeSabor: true
        }),
        // Productos de alta proteína
        (controller as any).advancedSearchUseCase.execute({
          clienteId,
          altaProteina: true,
          limit: 5,
          includeCategoria: true,
          sortBy: 'proteina',
          sortOrder: 'desc'
        }),
        // Productos bajas calorías
        (controller as any).advancedSearchUseCase.execute({
          clienteId,
          bajasCaloria: true,
          limit: 5,
          includeCategoria: true,
          sortBy: 'calorias',
          sortOrder: 'asc'
        }),
        // Productos compatibles con alergias
        (controller as any).advancedSearchUseCase.execute({
          clienteId,
          soloCompletos: true,
          limit: 8,
          includeCategoria: true,
          includeSabor: true
        })
      ]);

      const recomendaciones = {
        favoritos: {
          titulo: 'Tus Productos Favoritos',
          descripcion: 'Productos que has marcado como favoritos',
          productos: favoritosResult.productos,
          total: favoritosResult.pagination.total
        },
        altaProteina: {
          titulo: 'Alta en Proteína',
          descripcion: 'Productos con 20g o más de proteína',
          productos: altaProteinaResult.productos,
          criterio: '≥ 20g proteína'
        },
        bajasCaloria: {
          titulo: 'Bajas Calorías',
          descripcion: 'Productos con 200 calorías o menos',
          productos: bajasCaloriaResult.productos,
          criterio: '≤ 200 calorías'
        },
        compatibles: {
          titulo: 'Compatibles Contigo',
          descripcion: 'Productos sin tus alérgenos conocidos',
          productos: compatiblesResult.productos.filter((p: any) => 
            p.compatibilidadCliente?.sinAlergenos
          ).slice(0, 5),
          sinAlergenos: true
        },
        paraManana: {
          titulo: 'Para Empezar el Día',
          descripcion: 'Productos recomendados para la mañana',
          productos: compatiblesResult.productos.filter((p: any) => 
            p.momentosRecomendados.includes('MANANA')
          ).slice(0, 4)
        },
        preEntrenamiento: {
          titulo: 'Pre-Entrenamiento',
          descripcion: 'Energía antes de entrenar',
          productos: compatiblesResult.productos.filter((p: any) => 
            p.momentosRecomendados.includes('PRE_ENTRENAMIENTO')
          ).slice(0, 4)
        }
      };

      const resumen = {
        totalRecomendaciones: Object.values(recomendaciones).reduce((total, categoria) => 
          total + (categoria.productos?.length || 0), 0
        ),
        categorias: Object.keys(recomendaciones).length,
        tienePreferencias: favoritosResult.pagination.total > 0,
        compatibilidadAlergenos: recomendaciones.compatibles.productos.length
      };

      logger.success('Recomendaciones generadas', { 
        clienteId,
        ...resumen
      });

      const response = ResponseUtil.success({
        recomendaciones,
        resumen,
        metadata: {
          clienteId,
          generadoEn: new Date().toISOString(),
          algoritmo: 'preference_based_v1'
        }
      }, 'Recomendaciones generadas exitosamente');
      
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generando recomendaciones', { 
        clienteId: req.params.clienteId,
        error: errorMessage 
      });
      next(error);
    }
  }
);

export { router as advancedProductSearchRoutes };

router.get('/search/trending', 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const controller = new AdvancedProductSearchController();
      
      // Búsqueda de productos trending (simulado - podrías implementar lógica real)
      const dto: AdvancedProductSearchDto = {
        sortBy: 'fechaCreacion',
        sortOrder: 'desc',
        limit: 10,
        includeCategoria: true,
        includeSabor: true,
        includeEstadisticas: true
      };

      const result = await (controller as any).advancedSearchUseCase.execute(dto);
      
      const trending = {
        productos: result.productos,
        metadata: {
          algoritmo: 'recent_popularity',
          fechaActualizacion: new Date().toISOString(),
          criterios: ['fechaCreacion', 'popularidad', 'recomendaciones']
        }
      };

      const response = ResponseUtil.success(trending, 'Productos en tendencia obtenidos exitosamente');
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);
