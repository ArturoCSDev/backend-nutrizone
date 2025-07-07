import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaControlFisicoRepository } from '../repositories/prisma-control-fisico.repository';
import { PrismaClienteRepository } from '../../../client/infrastructure/repositories/prisma-cliente.repository';
import { PrismaUsuarioRepository } from '../../../auth/infrastructure/repositories/prisma-usuario.repository';

// Use Cases
import { RegisterControlFisicoUseCase } from '../../application/register-control-fisico/register-control-fisico.use-case';
import { ListControlFisicoUseCase } from '../../application/list-control-fisico/list-control-fisico.use-case';
import { GetControlFisicoUseCase } from '../../application/get-control-fisico/get-control-fisico.use-case';
import { UpdateControlFisicoUseCase } from '../../application/update-control-fisico/update-control-fisico.use-case';
import { DeleteControlFisicoUseCase } from '../../application/delete-control-fisico/delete-control-fisico.use-case';

export class NutritionPlansController {
  // Instanciación manual de repositorios
  private readonly controlFisicoRepository = new PrismaControlFisicoRepository();
  private readonly clienteRepository = new PrismaClienteRepository();
  private readonly usuarioRepository = new PrismaUsuarioRepository();

  // Instanciación de use cases
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
  // ENDPOINTS
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