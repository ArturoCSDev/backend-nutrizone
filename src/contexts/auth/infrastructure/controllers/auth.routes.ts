import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validationMiddleware } from '../../../../shared/infrastructure/middleware/validation.middleware';

// DTOs
import { LoginDto } from '../../application/login/login.dto';
import { RegisterClientDto } from '../../application/register-client/register-client.dto';
import { RegisterAdminDto } from '../../application/register-admin/register-admin.dto';
import { ListUserClientsDto } from '../../application/list-user-clients/list-user-clients.dto';
import { ListUserAdminsDto } from '../../application/list-user-admins/list-user-admins.dto';

const router = Router();
const authController = new AuthController();

// =============================================
// RUTAS PÚBLICAS
// =============================================

/**
 * @route POST /auth/login
 * @desc Iniciar sesión
 * @access Public
 */
router.post('/login', 
  validationMiddleware(LoginDto),
  authController.login
);

/**
 * @route POST /auth/register/client
 * @desc Registrar cliente (3 pasos en 1)
 * @access Public
 */
router.post('/register/client', 
  validationMiddleware(RegisterClientDto),
  authController.registerClient
);

// =============================================
// RUTAS PROTEGIDAS (ADMIN ONLY)
// =============================================

/**
 * @route POST /auth/register/admin
 * @desc Registrar administrador
 * @access Private (Solo Super Admin)
 */
router.post('/register/admin', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  validationMiddleware(RegisterAdminDto),
  authController.registerAdmin
);

/**
 * @route GET /auth/users/clients
 * @desc Listar usuarios clientes
 * @access Private (Solo Admin)
 */
router.get('/users/clients', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  // validationMiddleware(ListUserClientsDto), // Para query params es opcional
  authController.listUserClients
);

/**
 * @route GET /auth/users/admins
 * @desc Listar usuarios administradores
 * @access Private (Solo Super Admin)
 */
router.get('/users/admins', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  // validationMiddleware(ListUserAdminsDto), // Para query params es opcional
  authController.listUserAdmins
);

export { router as authRoutes };
