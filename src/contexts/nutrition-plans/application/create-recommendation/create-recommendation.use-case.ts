// src/contexts/nutrition-plans/application/create-recommendation/create-recommendation.use-case.ts
import { CreateRecommendationDto } from './create-recommendation.dto';
import { ClaudeMCPAdapter } from '../../../../shared/infrastructure/adapters/claude/claude-mcp.adapter';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { RecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { RespuestaUsuario } from '@prisma/client';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

export class CreateRecommendationMCPUseCase {
  constructor(
    private readonly recomendacionRepository: RecomendacionNutricionalRepository
  ) {}

  async execute(dto: CreateRecommendationDto) {
    const startTime = Date.now();

    try {
      logger.info('Ejecutando CreateRecommendationMCPUseCase', {
        clienteId: dto.clienteId,
        contexto: dto.contexto,
        objetivoEspecifico: dto.objetivoEspecifico
      });

      // ✅ Usar Claude con MCP (versión mejorada)
      const claudeResult = await ClaudeMCPAdapter.generateRecommendationWithMCP({
        clienteId: dto.clienteId,
        contexto: dto.contexto,
        objetivoEspecifico: dto.objetivoEspecifico,
        momentoDelDia: dto.momentoDelDia,
        soloFavoritos: dto.soloFavoritos,
        precioMaximo: 100
      });

      // ✅ Crear objetos de dominio
      const recomendaciones = claudeResult.recomendaciones.map((rec: any) => 
        RecomendacionNutricional.create({
          mensajeId: null,
          productoId: rec.productoId,
          tamanoId: null,
          planId: dto.planId || null,
          tituloRecomendacion: rec.tituloRecomendacion,
          iconoProducto: rec.iconoProducto,
          timingRecomendado: rec.timingRecomendado,
          horarioEspecifico: null,
          timingAdicional: null,
          prioridad: rec.prioridad as any,
          razonamiento: rec.razonamiento,
          dosis: rec.dosis,
          frecuencia: rec.frecuencia,
          respuestaUsuario: RespuestaUsuario.PENDIENTE,
          timingModificado: null
        })
      );

      // ✅ Guardar recomendaciones
      const savedRecomendaciones = await this.recomendacionRepository.saveMany(recomendaciones);

      const processingTime = Date.now() - startTime;

      logger.success('Recomendaciones MCP generadas exitosamente', {
        clienteId: dto.clienteId,
        recomendacionesGeneradas: savedRecomendaciones.length,
        processingTime
      });

      return {
        recomendaciones: savedRecomendaciones,
        razonamientoGeneral: claudeResult.razonamientoGeneral,
        metadatos: {
          processingTime,
          usedMCP: true,
          fallback: claudeResult.metadatos?.fallback || false
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Error en CreateRecommendationMCPUseCase', {
        clienteId: dto.clienteId,
        error: errorMessage
      });

      // ✅ Si todo falla, lanzar error descriptivo
      throw new Error(`Error generando recomendaciones MCP: ${errorMessage}`);
    }
  }
}