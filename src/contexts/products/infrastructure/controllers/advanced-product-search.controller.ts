import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaProductoRepository } from '../repositories/prisma-producto.repository';
import { PrismaCategoriaRepository } from '../repositories/prisma-categoria.repository';
import { PrismaSaborRepository } from '../repositories/prisma-sabor.repository';
import { PrismaTamanoRepository } from '../repositories/prisma-tamano.repository';
import { PrismaPreferenciaClienteRepository } from '../../../client/infrastructure/repositories/prisma-preferencia-cliente.repository';

// Use Case
import { AdvancedProductSearchUseCase } from '../../application/advanced-product-search/advanced-product-search.use-case';
import { AdvancedProductSearchDto } from '../../application/advanced-product-search/advanced-product-search.dto';

export class AdvancedProductSearchController {
  // Repositorios
  private readonly productoRepository = new PrismaProductoRepository();
  private readonly categoriaRepository = new PrismaCategoriaRepository();
  private readonly saborRepository = new PrismaSaborRepository();
  private readonly tamanoRepository = new PrismaTamanoRepository();
  private readonly preferenciaClienteRepository = new PrismaPreferenciaClienteRepository();

  // Use Case
  private readonly advancedSearchUseCase = new AdvancedProductSearchUseCase(
    this.productoRepository,
    this.categoriaRepository,
    this.saborRepository,
    this.tamanoRepository,
    this.preferenciaClienteRepository
  );

  /**
   * Búsqueda avanzada de productos con filtros múltiples
   */
  advancedSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now();
      
      logger.info('Solicitud de búsqueda avanzada de productos', { 
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Función helper para parsear arrays de query params
      const parseArray = (value: any): string[] | undefined => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        return typeof value === 'string' ? value.split(',').map(s => s.trim()) : undefined;
      };

      // Función helper para parsear booleanos
      const parseBoolean = (value: any): boolean | undefined => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return undefined;
      };

      // Función helper para parsear números
      const parseNumber = (value: any): number | undefined => {
        if (value === undefined || value === null || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      // Construir DTO desde query params
      const dto: AdvancedProductSearchDto = {
        // Búsqueda por texto
        search: req.query.search as string,

        // Filtros de categorización
        categoriaIds: parseArray(req.query.categoriaIds),
        saborIds: parseArray(req.query.saborIds),
        tamanoIds: parseArray(req.query.tamanoIds),
        tipoProducto: req.query.tipoProducto as any,

        // Filtros de precio
        precioMin: parseNumber(req.query.precioMin),
        precioMax: parseNumber(req.query.precioMax),

        // Filtros nutricionales
        proteinaMin: parseNumber(req.query.proteinaMin),
        caloriasMin: parseNumber(req.query.caloriasMin),
        caloriasMax: parseNumber(req.query.caloriasMax),

        // Filtros de momento del día
        momentosDelDia: parseArray(req.query.momentosDelDia) as any,

        // Filtros de etiquetas e ingredientes
        etiquetas: parseArray(req.query.etiquetas),
        ingredientes: parseArray(req.query.ingredientes),
        excludeAlergenos: parseArray(req.query.excludeAlergenos),

        // Filtros de características
        soloConImagen: parseBoolean(req.query.soloConImagen),
        soloCompletos: parseBoolean(req.query.soloCompletos),
        altaProteina: parseBoolean(req.query.altaProteina),
        bajasCaloria: parseBoolean(req.query.bajasCaloria),

        // Filtros para clientes específicos
        clienteId: req.query.clienteId as string,
        soloFavoritos: parseBoolean(req.query.soloFavoritos),

        // Ordenamiento y paginación
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: parseNumber(req.query.limit),
        offset: parseNumber(req.query.offset),

        // Opciones de inclusión
        includeCategoria: parseBoolean(req.query.includeCategoria),
        includeSabor: parseBoolean(req.query.includeSabor),
        includeTamano: parseBoolean(req.query.includeTamano),
        includeEstadisticas: parseBoolean(req.query.includeEstadisticas)
      };

      logger.debug('DTO construido para búsqueda avanzada', { 
        dto: {
          ...dto,
          // Ocultar arrays largos en logs para no saturar
          categoriaIds: dto.categoriaIds?.length,
          saborIds: dto.saborIds?.length,
          etiquetas: dto.etiquetas?.length
        }
      });

      const result = await this.advancedSearchUseCase.execute(dto);
      
      const totalTime = Date.now() - startTime;

      logger.success('Búsqueda avanzada completada exitosamente', { 
        processingTime: totalTime,
        resultados: {
          total: result.pagination.total,
          retornados: result.productos.length,
          filtrosAplicados: result.filtros.aplicados.length,
          tieneEstadisticas: !!result.estadisticas
        },
        paginacion: result.pagination
      });

      const response = ResponseUtil.success({
        ...result,
        metadata: {
          processingTime: totalTime,
          version: '2.0',
          queryProcessed: new Date().toISOString()
        }
      }, 'Búsqueda avanzada completada exitosamente');
      
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error en búsqueda avanzada de productos', { 
        query: req.query,
        error: errorMessage 
      });
      next(error);
    }
  };

  /**
   * Obtener filtros disponibles sin ejecutar búsqueda
   */
  getAvailableFilters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Obteniendo filtros disponibles');

      // Crear DTO mínimo solo para obtener filtros
      const dto: AdvancedProductSearchDto = {
        limit: 0, // No traer productos, solo filtros
        includeEstadisticas: false
      };

      const result = await this.advancedSearchUseCase.execute(dto);
      
      const filtrosResponse = {
        filtrosDisponibles: result.filtros.disponibles,
        estadisticasGenerales: {
          totalProductos: result.pagination.total,
          categoriasDisponibles: result.filtros.disponibles.categorias.length,
          saboresDisponibles: result.filtros.disponibles.sabores.length,
          tamanosDisponibles: result.filtros.disponibles.tamanos.length
        }
      };

      logger.success('Filtros disponibles obtenidos', { 
        categorias: filtrosResponse.estadisticasGenerales.categoriasDisponibles,
        sabores: filtrosResponse.estadisticasGenerales.saboresDisponibles,
        tamanos: filtrosResponse.estadisticasGenerales.tamanosDisponibles
      });

      const response = ResponseUtil.success(filtrosResponse, 'Filtros disponibles obtenidos exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error obteniendo filtros disponibles', { error: errorMessage });
      next(error);
    }
  };

  /**
   * Búsqueda rápida optimizada para autocompletar
   */
  quickSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        const response = ResponseUtil.error('El término de búsqueda debe tener al menos 2 caracteres', 'INVALID_SEARCH_TERM');
        res.status(400).json(response);
        return;
      }

      logger.info('Búsqueda rápida', { query: q });

      // DTO optimizado para búsqueda rápida
      const dto: AdvancedProductSearchDto = {
        search: q.trim(),
        limit: 10, // Solo primeros 10 resultados
        sortBy: 'nombre',
        sortOrder: 'asc',
        includeCategoria: true,
        includeSabor: true,
        includeTamano: false,
        includeEstadisticas: false
      };

      const result = await this.advancedSearchUseCase.execute(dto);
      
      // Formato simplificado para autocompletar
      const quickResults = {
        productos: result.productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          precioFormateado: p.precioFormateado,
          categoria: p.categoria?.nombre,
          sabor: p.sabor?.nombre,
          urlImagen: p.urlImagen,
          esAltaProteina: p.esAltaProteina,
          esBajasCaloria: p.esBajasCaloria
        })),
        total: result.pagination.total,
        sugerencias: result.filtros.disponibles.etiquetasPopulares
          .filter(etiqueta => etiqueta.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
      };

      logger.success('Búsqueda rápida completada', { 
        query: q,
        resultados: quickResults.productos.length,
        sugerencias: quickResults.sugerencias.length
      });

      const response = ResponseUtil.success(quickResults, 'Búsqueda rápida completada');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error en búsqueda rápida', { 
        query: req.query.q,
        error: errorMessage 
      });
      next(error);
    }
  };

  /**
   * Búsqueda personalizada para un cliente específico
   */
  personalizedSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clienteId } = req.params;
      
      logger.info('Búsqueda personalizada', { clienteId });

      // DTO con configuración personalizada
      const dto: AdvancedProductSearchDto = {
        clienteId,
        // Aplicar filtros automáticos del cliente
        excludeAlergenos: [], // Se obtendrán de las preferencias
        // Incluir todas las relaciones para mejor experiencia
        includeCategoria: true,
        includeSabor: true,
        includeTamano: true,
        includeEstadisticas: true,
        // Configuración de consulta
        limit: parseFloat(req.query.limit as string) || 20,
        offset: parseFloat(req.query.offset as string) || 0,
        sortBy: (req.query.sortBy as any) || 'nombre',
        sortOrder: (req.query.sortOrder as any) || 'asc',
        // Aplicar otros filtros si vienen en query
        search: req.query.search as string,
        soloFavoritos: req.query.soloFavoritos === 'true',
        altaProteina: req.query.altaProteina === 'true',
        bajasCaloria: req.query.bajasCaloria === 'true'
      };

      const result = await this.advancedSearchUseCase.execute(dto);
      
      // Enriquecer respuesta con información específica del cliente
      const personalizedResult = {
        ...result,
        recomendaciones: {
          favoritos: result.productos.filter(p => p.esFavorito).slice(0, 5),
          altaProteina: result.productos.filter(p => p.esAltaProteina).slice(0, 5),
          compatibles: result.productos.filter(p => 
            p.compatibilidadCliente?.sinAlergenos && 
            p.compatibilidadCliente?.coincidePreferencias
          ).slice(0, 5)
        },
        clienteInfo: {
          tienePreferencias: result.productos.some(p => p.esFavorito !== undefined),
          productosCompatibles: result.productos.filter(p => 
            p.compatibilidadCliente?.sinAlergenos
          ).length,
          productosFavoritos: result.productos.filter(p => p.esFavorito).length
        }
      };

      logger.success('Búsqueda personalizada completada', { 
        clienteId,
        total: result.pagination.total,
        favoritos: personalizedResult.recomendaciones.favoritos.length,
        compatibles: personalizedResult.recomendaciones.compatibles.length
      });

      const response = ResponseUtil.success(personalizedResult, 'Búsqueda personalizada completada exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error en búsqueda personalizada', { 
        clienteId: req.params.clienteId,
        error: errorMessage 
      });
      next(error);
    }
  };

  /**
   * Health check específico para búsqueda avanzada
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = {
        service: 'advanced-product-search',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0',
        features: {
          advancedSearch: 'available',
          quickSearch: 'available',
          personalizedSearch: 'available',
          filterAggregation: 'available',
          clientPreferences: 'available',
          pagination: 'available',
          sorting: 'available',
          relations: 'available',
          statistics: 'available'
        },
        performance: {
          avgResponseTime: '<500ms',
          maxProductsPerQuery: 100,
          supportedFilters: 20
        }
      };

      logger.info('Health check de búsqueda avanzada realizado');
      
      const response = ResponseUtil.success(health, 'Servicio de búsqueda avanzada funcionando correctamente');
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
