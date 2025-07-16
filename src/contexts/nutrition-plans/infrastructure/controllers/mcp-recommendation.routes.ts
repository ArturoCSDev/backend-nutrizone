import { Router } from 'express';
import { MCPRecommendationController } from './mcp-recommendation.controller';
import { validationMiddleware } from '../../../../shared/infrastructure/middleware/validation.middleware';
import { CreateRecommendationDto } from '../../application/create-recommendation/create-recommendation.dto';

const router = Router();
const mcpRecommendationController = new MCPRecommendationController();

/**
 * @route POST /mcp/recommendations
 * @desc Crear recomendación usando MCP Server
 * @access Private
 * @body {CreateRecommendationDto}
 */
router.post('/recommendations', 
  // authMiddleware, // Descomenta cuando tengas el middleware
  validationMiddleware(CreateRecommendationDto),
  mcpRecommendationController.createRecommendationWithMCP
);

/**
 * @route GET /mcp/health
 * @desc Verificar estado del MCP Server
 * @access Private
 */
router.get('/health', 
  mcpRecommendationController.checkMCPHealth
);

export { router as mcpRecommendationRoutes };
