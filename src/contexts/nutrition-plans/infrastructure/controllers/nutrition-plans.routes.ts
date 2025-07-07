import { Router } from 'express';
import { NutritionPlansController } from './nutrition-plans.controller';
import { validationMiddleware } from '../../../../shared/infrastructure/middleware/validation.middleware';

// DTOs
import { RegisterControlFisicoDto } from '../../application/register-control-fisico/register-control-fisico.dto';
import { ListControlFisicoDto } from '../../application/list-control-fisico/list-control-fisico.dto';
import { UpdateControlFisicoHttpDto } from '../../application/update-control-fisico/update-control-fisico.dto';
import { UpdateControlFisicoDto } from '../../application/update-control-fisico/update-control-fisico.dto';

const router = Router();
const nutritionPlansController = new NutritionPlansController();

// =============================================
// RUTAS PROTEGIDAS - CONTROLES FÍSICOS
// =============================================

/**
 * @route POST /nutrition-plans/control-fisico
 * @desc Registrar control físico de un cliente
 * @access Private (Cliente/Admin)
 */
router.post('/control-fisico', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  validationMiddleware(RegisterControlFisicoDto),
  nutritionPlansController.registerControlFisico
);

/**
 * @route GET /nutrition-plans/control-fisico
 * @desc Listar controles físicos con filtros
 * @access Private (Cliente/Admin)
 */
router.get('/control-fisico', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  // validationMiddleware(ListControlFisicoDto), // Para query params es opcional
  nutritionPlansController.listControlFisico
);

/**
 * @route GET /nutrition-plans/control-fisico/:id
 * @desc Obtener un control físico específico
 * @access Private (Cliente/Admin)
 */
router.get('/control-fisico/:id', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  nutritionPlansController.getControlFisico
);

/**
 * @route PUT /nutrition-plans/control-fisico/:id
 * @desc Actualizar un control físico específico
 * @access Private (Cliente/Admin)
 */
router.put('/control-fisico/:id', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  validationMiddleware(UpdateControlFisicoHttpDto),
  nutritionPlansController.updateControlFisico
);

/**
 * @route DELETE /nutrition-plans/control-fisico/:id
 * @desc Eliminar un control físico específico
 * @access Private (Cliente/Admin)
 */
router.delete('/control-fisico/:id', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  nutritionPlansController.deleteControlFisico
);

export { router as nutritionPlansRoutes };