import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaUsuarioRepository } from '../../../auth/infrastructure/repositories/prisma-usuario.repository';
import { PrismaClienteRepository } from '../../../client/infrastructure/repositories/prisma-cliente.repository';
import { PrismaPreferenciaClienteRepository } from '../../../client/infrastructure/repositories/prisma-preferencia-cliente.repository';
import { PrismaPlanNutricionalRepository } from '../repositories/prisma-plan-nutricional.repository';
import { PrismaRecomendacionNutricionalRepository } from '../repositories/prisma-recomendacion-nutricional.repository';
import { PrismaControlFisicoRepository } from '../repositories/prisma-control-fisico.repository';
import { PrismaProductoRepository } from '../../../products/infrastructure/repositories/prisma-producto.repository';

// Use Case
import { VerAsesoriaCompletaUseCase } from '../../application/ver-asesoria-completa/ver-asesoria-completa.use-case';
import { VerAsesoriaCompletaDto } from '../../application/ver-asesoria-completa/ver-asesoria-completa.dto';

export class AsesoriaCompletaController {
  // Repositorios
  private readonly usuarioRepository = new PrismaUsuarioRepository();
  private readonly clienteRepository = new PrismaClienteRepository();
  private readonly preferenciaClienteRepository = new PrismaPreferenciaClienteRepository();
  private readonly planNutricionalRepository = new PrismaPlanNutricionalRepository();
  private readonly recomendacionNutricionalRepository = new PrismaRecomendacionNutricionalRepository();
  private readonly controlFisicoRepository = new PrismaControlFisicoRepository();
  private readonly productoRepository = new PrismaProductoRepository();

  // Use Case
  private readonly verAsesoriaCompletaUseCase = new VerAsesoriaCompletaUseCase(
    this.usuarioRepository,
    this.clienteRepository,
    this.preferenciaClienteRepository,
    this.planNutricionalRepository,
    this.recomendacionNutricionalRepository,
    this.controlFisicoRepository,
    this.productoRepository
  );

  /**
   * Obtener asesoría completa de un cliente
   */
  verAsesoriaCompleta = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now();
      
      logger.info('Solicitud de asesoría completa', { 
        clienteId: req.params.clienteId,
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Función helper para parsear booleanos de query params
      const parseBoolean = (value: any): boolean | undefined => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return undefined;
      };

      // Construir DTO desde params y query
      const dto: VerAsesoriaCompletaDto = {
        clienteId: req.params.clienteId,
        diasHistorial: req.query.diasHistorial ? parseInt(req.query.diasHistorial as string) : undefined,
        includeHistorialControles: parseBoolean(req.query.includeHistorialControles),
        includeRecomendacionesHistoricas: parseBoolean(req.query.includeRecomendacionesHistoricas),
        includeProductosDetalle: parseBoolean(req.query.includeProductosDetalle),
        includeEstadisticas: parseBoolean(req.query.includeEstadisticas)
      };

      logger.debug('DTO construido para asesoría completa', { dto });

      const result = await this.verAsesoriaCompletaUseCase.execute(dto);
      
      const totalTime = Date.now() - startTime;

      logger.success('Asesoría completa obtenida exitosamente', { 
        clienteId: dto.clienteId,
        processingTime: totalTime,
        dataSize: {
          planActivo: !!result.planActivo,
          recomendacionesActivas: result.recomendaciones.activas.length,
          recomendacionesHistoricas: result.recomendaciones.historicas?.length || 0,
          controlesHistorial: result.controlesFisicos.historial.length,
          alertas: result.resumen.alertas.length,
          siguientesPasos: result.resumen.siguientesPasos.length
        },
        cliente: {
          nombre: result.cliente.nombreCompleto,
          hasCompleteProfile: result.cliente.hasCompleteProfile,
          active: result.cliente.active
        }
      });

      const response = ResponseUtil.success({
        ...result,
        metadata: {
          ...result.metadata,
          processingTime: totalTime
        }
      }, 'Asesoría completa obtenida exitosamente');
      
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error obteniendo asesoría completa', { 
        clienteId: req.params.clienteId,
        query: req.query,
        error: errorMessage 
      });
      next(error);
    }
  };

  /**
   * Obtener resumen rápido de asesoría (versión ligera)
   */
  verResumenAsesoria = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Solicitud de resumen de asesoría', { 
        clienteId: req.params.clienteId 
      });

      // Versión ligera: solo datos esenciales
      const dto: VerAsesoriaCompletaDto = {
        clienteId: req.params.clienteId,
        diasHistorial: 30, // Solo último mes
        includeHistorialControles: false,
        includeRecomendacionesHistoricas: false,
        includeProductosDetalle: false,
        includeEstadisticas: false
      };

      const result = await this.verAsesoriaCompletaUseCase.execute(dto);
      
      // Extraer solo datos de resumen
      const resumen = {
        cliente: {
          id: result.cliente.id,
          nombreCompleto: result.cliente.nombreCompleto,
          hasCompleteProfile: result.cliente.hasCompleteProfile,
          active: result.cliente.active
        },
        estado: result.resumen.estado,
        planActivo: result.resumen.planActivo,
        recomendacionesPendientes: result.resumen.recomendacionesPendientes,
        proximoControl: result.resumen.proximoControl,
        alertas: result.resumen.alertas,
        ultimoControl: result.controlesFisicos.ultimo?.fechaControl || null,
        fechaConsulta: result.metadata.fechaConsulta
      };

      logger.success('Resumen de asesoría obtenido', { 
        clienteId: dto.clienteId,
        estado: resumen.estado,
        alertas: resumen.alertas.length
      });

      const response = ResponseUtil.success(resumen, 'Resumen de asesoría obtenido exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error obteniendo resumen de asesoría', { 
        clienteId: req.params.clienteId,
        error: errorMessage 
      });
      next(error);
    }
  };

  /**
   * Health check específico para asesoría completa
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = {
        service: 'asesoria-completa',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: 'connected',
          repositories: 'loaded',
          useCase: 'ready'
        },
        features: {
          verAsesoriaCompleta: 'available',
          verResumenAsesoria: 'available',
          estadisticas: 'available',
          tendencias: 'available'
        }
      };

      logger.info('Health check de asesoría completa realizado');
      
      const response = ResponseUtil.success(health, 'Servicio de asesoría completa funcionando correctamente');
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
