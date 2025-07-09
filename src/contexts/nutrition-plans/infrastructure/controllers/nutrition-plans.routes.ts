// contexts/nutrition-plans/infrastructure/controllers/nutrition-plans.routes.ts
import { Router } from 'express';
import { NutritionPlansController } from './nutrition-plans.controller';
import { validationMiddleware } from '../../../../shared/infrastructure/middleware/validation.middleware';

// DTOs - Controles Físicos (existentes)
import { RegisterControlFisicoDto } from '../../application/register-control-fisico/register-control-fisico.dto';
import { ListControlFisicoDto } from '../../application/list-control-fisico/list-control-fisico.dto';
import { UpdateControlFisicoHttpDto } from '../../application/update-control-fisico/update-control-fisico.dto';

// DTOs - Planes Nutricionales (nuevos)
import { CreatePlanNutricionalDto } from '../../application/create-plan-nutricional/create-plan-nutricional.dto';
import { GetPlanNutricionalDto } from '../../application/get-plan-nutricional/get-plan-nutricional.dto';
import { GetPlanByClienteDto } from '../../application/get-plan-nutricional/get-plan-nutricional.dto';

const router = Router();
const nutritionPlansController = new NutritionPlansController();

// =============================================
// RUTAS - PLANES NUTRICIONALES
// =============================================

/**
 * @route POST /nutrition-plans/plan
 * @desc Crear un nuevo plan nutricional
 * @access Private (Cliente/Admin)
 */
router.post('/plan', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  validationMiddleware(CreatePlanNutricionalDto),
  nutritionPlansController.createPlanNutricional
);

/**
 * @route GET /nutrition-plans/plan/:id
 * @desc Obtener un plan nutricional específico
 * @query includeRecomendaciones=true|false
 * @query includeProductos=true|false
 * @query includeCliente=true|false
 * @query onlyPendingRecomendaciones=true|false
 * @access Private (Cliente/Admin)
 */
router.get('/plan/:id', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  // validationMiddleware(GetPlanNutricionalDto), // Para query params es opcional
  nutritionPlansController.getPlanNutricional
);

/**
 * @route GET /nutrition-plans/cliente/:clienteId/planes
 * @desc Obtener todos los planes nutricionales de un cliente
 * @query onlyActive=true|false
 * @query includeRecomendaciones=true|false
 * @query includeProductos=true|false
 * @access Private (Cliente/Admin)
 */
router.get('/cliente/:clienteId/planes', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  // validationMiddleware(GetPlanByClienteDto), // Para query params es opcional
  nutritionPlansController.getPlanNutricionalByCliente
);

/**
 * @route GET /nutrition-plans/cliente/:clienteId/plan-activo
 * @desc Obtener el plan nutricional activo de un cliente (shortcut)
 * @query includeRecomendaciones=true|false
 * @query includeProductos=true|false
 * @access Private (Cliente/Admin)
 */
router.get('/cliente/:clienteId/plan-activo', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware(['CLIENTE', 'ADMINISTRADOR']), // Descomenta cuando tengas el middleware
  (req, res, next) => {
    // Agregar onlyActive=true automáticamente
    req.query.onlyActive = 'true';
    next();
  },
  nutritionPlansController.getPlanNutricionalByCliente
);

// =============================================
// RUTAS - CONTROLES FÍSICOS (existentes)
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

// =============================================
// RUTAS ADICIONALES ÚTILES
// =============================================

/**
 * @route GET /nutrition-plans/health
 * @desc Health check específico para nutrition plans
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Nutrition Plans service is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      plans: '/nutrition-plans/plan',
      controls: '/nutrition-plans/control-fisico'
    }
  });
});

export { router as nutritionPlansRoutes };