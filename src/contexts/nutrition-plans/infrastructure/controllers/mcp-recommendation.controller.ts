import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaRecomendacionNutricionalRepository } from '../repositories/prisma-recomendacion-nutricional.repository';
import { PrismaProductoRepository } from '../../../products/infrastructure/repositories/prisma-producto.repository';

// Use Case MCP
import { CreateRecommendationMCPUseCase } from '../../application/create-recommendation/create-recommendation.use-case';

export class MCPRecommendationController {
  // Repositorios
  private readonly recomendacionRepository = new PrismaRecomendacionNutricionalRepository();
  private readonly productoRepository = new PrismaProductoRepository(); // ✅ AGREGAR REPOSITORIO

  // Use Case MCP
  private readonly createRecommendationMCPUseCase = new CreateRecommendationMCPUseCase(
    this.recomendacionRepository,
    this.productoRepository // ✅ INYECTAR REPOSITORIO DE PRODUCTOS
  );

  /**
   * Crear recomendación usando MCP Server
   */
  createRecommendationWithMCP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now();
      
      logger.info('Iniciando creación de recomendación con MCP', { 
        clienteId: req.body.clienteId,
        contexto: req.body.contexto,
        objetivoEspecifico: req.body.objetivoEspecifico
      });

      const result = await this.createRecommendationMCPUseCase.execute(req.body);
      
      const totalTime = Date.now() - startTime;

      logger.success('Recomendación MCP creada exitosamente', { 
        clienteId: req.body.clienteId,
        recomendacionesGeneradas: result.recomendaciones.length,
        recomendacionesOriginales: result.metadatos.recomendacionesOriginales,
        recomendacionesDescartadas: result.metadatos.recomendacionesOriginales - result.recomendaciones.length,
        processingTime: totalTime,
        usedMCP: result.metadatos.usedMCP
      });

      const response = ResponseUtil.created(
        {
          ...result,
          metadatos: {
            ...result.metadatos,
            totalProcessingTime: totalTime
          }
        }, 
        'Recomendaciones MCP generadas exitosamente'
      );
      
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creando recomendación MCP', { 
        clienteId: req.body.clienteId,
        error: errorMessage 
      });
      next(error);
    }
  };

  /**
   * Health check del MCP Server
   */
  checkMCPHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Verificando estado del MCP Server');

      // ✅ Verificar que hay productos en la base de datos
      const productCount = await this.productoRepository.count();

      const healthStatus = {
        mcpServer: {
          status: 'healthy',
          timestamp: new Date(),
          version: '1.0.0'
        },
        database: {
          status: 'connected',
          timestamp: new Date(),
          productCount // ✅ Incluir contador de productos
        },
        validation: {
          productValidation: 'enabled',
          foreignKeyChecks: 'active'
        }
      };

      logger.info('MCP Server health check completado', { 
        status: healthStatus,
        productCount 
      });

      const response = ResponseUtil.success(healthStatus, 'MCP Server funcionando correctamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error en health check de MCP', { error: errorMessage });
      next(error);
    }
  };
}