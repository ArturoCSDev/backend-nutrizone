import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaPlanNutricionalRepository } from '../repositories/prisma-plan-nutricional.repository';
import { PrismaRecomendacionNutricionalRepository } from '../repositories/prisma-recomendacion-nutricional.repository';
import { PrismaClienteRepository } from '../../../client/infrastructure/repositories/prisma-cliente.repository';
import { PrismaPreferenciaClienteRepository } from '../../../client/infrastructure/repositories/prisma-preferencia-cliente.repository';
import { PrismaProductoRepository } from '../../../products/infrastructure/repositories/prisma-producto.repository';
import { PrismaControlFisicoRepository } from '../repositories/prisma-control-fisico.repository';
import { PrismaUsuarioRepository } from '../../../auth/infrastructure/repositories/prisma-usuario.repository';

// Use Cases - Controles Físicos (existentes)
import { RegisterControlFisicoUseCase } from '../../application/register-control-fisico/register-control-fisico.use-case';
import { ListControlFisicoUseCase } from '../../application/list-control-fisico/list-control-fisico.use-case';
import { GetControlFisicoUseCase } from '../../application/get-control-fisico/get-control-fisico.use-case';
import { UpdateControlFisicoUseCase } from '../../application/update-control-fisico/update-control-fisico.use-case';
import { DeleteControlFisicoUseCase } from '../../application/delete-control-fisico/delete-control-fisico.use-case';

// Use Cases - Planes Nutricionales (nuevos)
import { CreatePlanNutricionalUseCase } from '../../application/create-plan-nutricional/create-plan-nutricional.use-case';
import { GetPlanNutricionalUseCase } from '../../application/get-plan-nutricional/get-plan-nutricional.use-case';
import { GetPlanByClienteDto, GetPlanNutricionalDto } from '../../application/get-plan-nutricional/get-plan-nutricional.dto';

export class NutritionPlansController {
  // Instanciación manual de repositorios
  private readonly planNutricionalRepository = new PrismaPlanNutricionalRepository();
  private readonly recomendacionNutricionalRepository = new PrismaRecomendacionNutricionalRepository();
  private readonly clienteRepository = new PrismaClienteRepository();
  private readonly preferenciaClienteRepository = new PrismaPreferenciaClienteRepository();
  private readonly productoRepository = new PrismaProductoRepository();
  private readonly controlFisicoRepository = new PrismaControlFisicoRepository();
  private readonly usuarioRepository = new PrismaUsuarioRepository();

  // =============================================
  // USE CASES - CONTROLES FÍSICOS (existentes)
  // =============================================

  private readonly registerControlFisicoUseCase = new RegisterControlFisicoUseCase(
    this.controlFisicoRepository,
    this.clienteRepository
  );

  private readonly listControlFisicoUseCase = new ListControlFisicoUseCase(
    this.controlFisicoRepository,
    this.clienteRepository
  );

  private readonly getControlFisicoUseCase = new GetControlFisicoUseCase(
    this.controlFisicoRepository,
    this.clienteRepository,
    this.usuarioRepository
  );

  private readonly updateControlFisicoUseCase = new UpdateControlFisicoUseCase(
    this.controlFisicoRepository
  );

  private readonly deleteControlFisicoUseCase = new DeleteControlFisicoUseCase(
    this.controlFisicoRepository
  );

  // =============================================
  // USE CASES - PLANES NUTRICIONALES (nuevos)
  // =============================================

  private readonly createPlanNutricionalUseCase = new CreatePlanNutricionalUseCase(
    this.planNutricionalRepository,
    this.recomendacionNutricionalRepository,
    this.clienteRepository,
    this.preferenciaClienteRepository,
    this.productoRepository
  );

  private readonly getPlanNutricionalUseCase = new GetPlanNutricionalUseCase(
    this.planNutricionalRepository,
    this.recomendacionNutricionalRepository,
    this.clienteRepository,
    this.productoRepository
  );

  // =============================================
  // ENDPOINTS - PLANES NUTRICIONALES
  // =============================================

  createPlanNutricional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Plan nutricional creation attempt', { 
        clienteId: req.body.clienteId,
        objetivo: req.body.objetivo,
        duracionDias: req.body.duracionDias
      });

      const result = await this.createPlanNutricionalUseCase.execute(req.body);
      
      logger.success('Plan nutricional created successfully', { 
        planId: result.id,
        clienteId: result.clienteId,
        objetivo: result.objetivo,
        recomendaciones: result.recomendaciones.length
      });

      const response = ResponseUtil.created(result, 'Plan nutricional creado exitosamente');
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Plan nutricional creation failed', { 
        clienteId: req.body.clienteId,
        objetivo: req.body.objetivo,
        error: errorMessage 
      });
      next(error);
    }
  };

  getPlanNutricional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting plan nutricional', { 
        planId: req.params.id,
        query: req.query
      });

      const dto = {
        planId: req.params.id,
        includeRecomendaciones: req.query.includeRecomendaciones,
        includeProductos: req.query.includeProductos,
        includeCliente: req.query.includeCliente,
        onlyPendingRecomendaciones: req.query.onlyPendingRecomendaciones
      };

      const result = await this.getPlanNutricionalUseCase.execute(dto as GetPlanNutricionalDto);
      
      logger.success('Plan nutricional retrieved successfully', { 
        planId: result.id,
        clienteId: result.clienteId,
        recomendaciones: result.recomendaciones?.length || 0
      });

      const response = ResponseUtil.success(result, 'Plan nutricional obtenido exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get plan nutricional', { 
        planId: req.params.id,
        error: errorMessage 
      });
      next(error);
    }
  };

  getPlanNutricionalByCliente = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting planes nutricionales by cliente', { 
        clienteId: req.params.clienteId,
        query: req.query
      });

      const dto = {
        clienteId: req.params.clienteId,
        onlyActive: req.query.onlyActive,
        includeRecomendaciones: req.query.includeRecomendaciones,
        includeProductos: req.query.includeProductos
      };

      const result = await this.getPlanNutricionalUseCase.executeByCliente(dto as GetPlanByClienteDto);
      
      logger.success('Planes nutricionales retrieved successfully', { 
        clienteId: req.params.clienteId,
        planesEncontrados: result.length
      });

      const response = ResponseUtil.success(result, 'Planes nutricionales obtenidos exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get planes nutricionales by cliente', { 
        clienteId: req.params.clienteId,
        error: errorMessage 
      });
      next(error);
    }
  };

  // =============================================
  // ENDPOINTS - CONTROLES FÍSICOS (existentes)
  // =============================================

  registerControlFisico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Physical control registration attempt', { 
        clienteId: req.body.clienteId,
        fechaControl: req.body.fechaControl 
      });

      const result = await this.registerControlFisicoUseCase.execute(req.body);
      
      logger.success('Physical control registered successfully', { 
        controlId: result.controlFisico.id,
        clienteId: result.controlFisico.clienteId,
        fechaControl: result.controlFisico.fechaControl
      });

      const response = ResponseUtil.created(result, 'Control físico registrado exitosamente');
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Physical control registration failed', { 
        clienteId: req.body.clienteId,
        fechaControl: req.body.fechaControl,
        error: errorMessage 
      });
      next(error);
    }
  };

  listControlFisico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing physical controls', { 
        query: req.query 
      });

      const result = await this.listControlFisicoUseCase.execute(req.query);
      
      logger.success('Physical controls listed successfully', { 
        total: result.total,
        totalWithMetrics: result.summary.totalWithMetrics,
        clienteId: req.query.clienteId
      });

      const response = ResponseUtil.success(result, 'Lista de controles físicos obtenida exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list physical controls', { 
        query: req.query,
        error: errorMessage 
      });
      next(error);
    }
  };

  getControlFisico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting physical control', { 
        controlId: req.params.id 
      });

      const result = await this.getControlFisicoUseCase.execute({ id: req.params.id });
      
      logger.success('Physical control retrieved successfully', { 
        controlId: result.controlFisico.id,
        clienteId: result.controlFisico.clienteId,
        fechaControl: result.controlFisico.fechaControl
      });

      const response = ResponseUtil.success(result, 'Control físico obtenido exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get physical control', { 
        controlId: req.params.id,
        error: errorMessage 
      });
      next(error);
    }
  };

  updateControlFisico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Physical control update attempt', { 
        controlId: req.params.id,
        updateFields: Object.keys(req.body)
      });

      const updateData = { id: req.params.id, ...req.body };
      const result = await this.updateControlFisicoUseCase.execute(updateData);
      
      logger.success('Physical control updated successfully', { 
        controlId: result.controlFisico.id,
        clienteId: result.controlFisico.clienteId,
        fechaActualizacion: result.controlFisico.fechaActualizacion
      });

      const response = ResponseUtil.success(result, 'Control físico actualizado exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Physical control update failed', { 
        controlId: req.params.id,
        error: errorMessage 
      });
      next(error);
    }
  };

  deleteControlFisico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Physical control deletion attempt', { 
        controlId: req.params.id 
      });

      const result = await this.deleteControlFisicoUseCase.execute({ id: req.params.id });
      
      logger.success('Physical control deleted successfully', { 
        controlId: result.deletedControl.id,
        clienteId: result.deletedControl.clienteId,
        fechaControl: result.deletedControl.fechaControl
      });

      const response = ResponseUtil.success(result, 'Control físico eliminado exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Physical control deletion failed', { 
        controlId: req.params.id,
        error: errorMessage 
      });
      next(error);
    }
  };
}