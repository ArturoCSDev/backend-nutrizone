import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaUsuarioRepository } from '../repositories/prisma-usuario.repository';
import { PrismaAdministradorRepository } from '../repositories/prisma-administrador.repository';
import { PrismaClienteRepository } from '../../../client/infrastructure/repositories/prisma-cliente.repository';
import { PrismaPreferenciaClienteRepository } from '../../../client/infrastructure/repositories/prisma-preferencia-cliente.repository';

// Use Cases
import { LoginUseCase } from '../../application/login/login.use-case';
import { RegisterClientUseCase } from '../../application/register-client/register-client.use-case';
import { RegisterAdminUseCase } from '../../application/register-admin/register-admin.use-case';
import { ListUserClientsUseCase } from '../../application/list-user-clients/list-user-clients.use-case';
import { ListUserAdminsUseCase } from '../../application/list-user-admins/list-user-admins.use-case';

export class AuthController {
  // Instanciación manual de repositorios
  private readonly usuarioRepository = new PrismaUsuarioRepository();
  private readonly administradorRepository = new PrismaAdministradorRepository();
  private readonly clienteRepository = new PrismaClienteRepository();
  private readonly preferenciaRepository = new PrismaPreferenciaClienteRepository();

  // Instanciación de use cases
  private readonly loginUseCase = new LoginUseCase(
    this.usuarioRepository,
    this.clienteRepository,
    this.administradorRepository
  );

  private readonly registerClientUseCase = new RegisterClientUseCase(
    this.usuarioRepository,
    this.clienteRepository,
    this.preferenciaRepository
  );

  private readonly registerAdminUseCase = new RegisterAdminUseCase(
    this.usuarioRepository,
    this.administradorRepository
  );

  private readonly listUserClientsUseCase = new ListUserClientsUseCase(
    this.usuarioRepository,
    this.clienteRepository
  );

  private readonly listUserAdminsUseCase = new ListUserAdminsUseCase(
    this.usuarioRepository,
    this.administradorRepository
  );

  // =============================================
  // ENDPOINTS
  // =============================================

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Login attempt', { dni: req.body.dni });

      const result = await this.loginUseCase.execute(req.body);
      
      logger.success('Login successful', { 
        userId: result.user.id, 
        dni: result.user.dni, 
        rol: result.user.rol 
      });

      const response = ResponseUtil.success(result, 'Login exitoso');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Login failed', { 
        dni: req.body.dni, 
        error: errorMessage 
      });
      next(error);
    }
  };

  registerClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Client registration attempt', { email: req.body.email });

      const result = await this.registerClientUseCase.execute(req.body);
      
      logger.success('Client registered successfully', { 
        userId: result.user.id,
        clienteId: result.cliente.id
      });

      const response = ResponseUtil.created(result, 'Cliente registrado exitosamente');
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Client registration failed', { 
        email: req.body.email, 
        error: errorMessage 
      });
      next(error);
    }
  };

  registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Admin registration attempt', { email: req.body.email });

      const result = await this.registerAdminUseCase.execute(req.body);
      
      logger.success('Admin registered successfully', { 
        userId: result.user.id,
        adminId: result.admin.id
      });

      const response = ResponseUtil.created(result, 'Administrador registrado exitosamente');
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Admin registration failed', { 
        email: req.body.email, 
        error: errorMessage 
      });
      next(error);
    }
  };

  listUserClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing user clients', { query: req.query });

      const result = await this.listUserClientsUseCase.execute(req.query);
      
      logger.info('User clients listed successfully', { 
        total: result.total,
        active: result.summary.totalActive
      });

      const response = ResponseUtil.success(result, 'Lista de clientes obtenida exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list user clients', { error: errorMessage });
      next(error);
    }
  };

  listUserAdmins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing user admins', { query: req.query });

      const result = await this.listUserAdminsUseCase.execute(req.query);
      
      logger.info('User admins listed successfully', { 
        total: result.total,
        active: result.summary.totalActive
      });

      const response = ResponseUtil.success(result, 'Lista de administradores obtenida exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list user admins', { error: errorMessage });
      next(error);
    }
  };
}
