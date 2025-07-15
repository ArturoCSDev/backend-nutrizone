import { NextFunction, Request, Response, Router } from 'express';
import { AsesoriaCompletaController } from './asesoria.controller';
import { VerAsesoriaCompletaDto } from '../../application/ver-asesoria-completa/ver-asesoria-completa.dto';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';

const router = Router();
const asesoriaCompletaController = new AsesoriaCompletaController();

/**
 * @route GET /nutrition-plans/asesoria/:clienteId
 * @desc Obtener asesoría completa de un cliente (vista 360°)
 * @param clienteId - UUID del cliente
 * @query diasHistorial - Número de días de historial (7-365, default: 90)
 * @query includeHistorialControles - Incluir historial completo de controles (default: true)
 * @query includeRecomendacionesHistoricas - Incluir recomendaciones históricas (default: false)
 * @query includeProductosDetalle - Incluir detalles de productos (default: true)
 * @query includeEstadisticas - Incluir estadísticas calculadas (default: true)
 * @access Private (Cliente/Admin)
 * @example
 * GET /nutrition-plans/asesoria/uuid-cliente?diasHistorial=60&includeEstadisticas=true
 */
router.get('/asesoria/:clienteId', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  asesoriaCompletaController.verAsesoriaCompleta
);

/**
 * @route GET /nutrition-plans/asesoria/:clienteId/resumen
 * @desc Obtener resumen rápido de asesoría (versión ligera)
 * @param clienteId - UUID del cliente
 * @access Private (Cliente/Admin)
 * @example
 * GET /nutrition-plans/asesoria/uuid-cliente/resumen
 */
router.get('/asesoria/:clienteId/resumen', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  asesoriaCompletaController.verResumenAsesoria
);

/**
 * @route GET /nutrition-plans/asesoria/health
 * @desc Health check del servicio de asesoría completa
 * @access Public
 */
router.get('/asesoria/health', 
  asesoriaCompletaController.healthCheck
);

// ==========================================
// RUTAS ADICIONALES ÚTILES
// ==========================================

/**
 * @route GET /nutrition-plans/asesoria/:clienteId/alertas
 * @desc Obtener solo las alertas de un cliente
 * @param clienteId - UUID del cliente
 * @access Private
 */
router.get('/asesoria/:clienteId/alertas', 
  // authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const controller = new AsesoriaCompletaController();
      const dto: VerAsesoriaCompletaDto = {
        clienteId: req.params.clienteId,
        diasHistorial: 30,
        includeHistorialControles: false,
        includeRecomendacionesHistoricas: false,
        includeProductosDetalle: false,
        includeEstadisticas: false
      };

      const result = await (controller as any).verAsesoriaCompletaUseCase.execute(dto);
      
      const alertas = {
        alertas: result.resumen.alertas,
        notasImportantes: result.resumen.notasImportantes,
        siguientesPasos: result.resumen.siguientesPasos,
        totalAlertas: result.resumen.alertas.length,
        alertasAlta: result.resumen.alertas.filter((a: any) => a.prioridad === 'alta').length
      };

      const response = ResponseUtil.success(alertas, 'Alertas obtenidas exitosamente');
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /nutrition-plans/asesoria/:clienteId/estadisticas
 * @desc Obtener solo las estadísticas de un cliente
 * @param clienteId - UUID del cliente
 * @access Private
 */
router.get('/asesoria/:clienteId/estadisticas', 
  // authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const controller = new AsesoriaCompletaController();
      const dto: VerAsesoriaCompletaDto = {
        clienteId: req.params.clienteId,
        diasHistorial: parseInt(req.query.diasHistorial as string) || 90,
        includeHistorialControles: true,
        includeRecomendacionesHistoricas: true,
        includeProductosDetalle: false,
        includeEstadisticas: true
      };

      const result = await (controller as any).verAsesoriaCompletaUseCase.execute(dto);
      
      const response = ResponseUtil.success({
        estadisticas: result.estadisticas,
        tendencias: result.controlesFisicos.tendencias,
        resumenRecomendaciones: result.recomendaciones.resumen,
        resumenControles: result.controlesFisicos.resumen
      }, 'Estadísticas obtenidas exitosamente');
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export { router as asesoriaCompletaRoutes };
