import { CreateRecommendationDto } from './create-recommendation.dto';
import { ClaudeMCPAdapter } from '../../../../shared/infrastructure/adapters/claude/claude-mcp.adapter';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { RecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { RespuestaUsuario } from '@prisma/client';

export class CreateRecommendationMCPUseCase {
  constructor(
    private readonly recomendacionRepository: RecomendacionNutricionalRepository
  ) {}

  async execute(dto: CreateRecommendationDto) {
    const startTime = Date.now();

    // Usar Claude con MCP para generar recomendaciones
    const claudeResult = await ClaudeMCPAdapter.generateRecommendationWithMCP({
      clienteId: dto.clienteId,
      contexto: dto.contexto,
      objetivoEspecifico: dto.objetivoEspecifico,
      momentoDelDia: dto.momentoDelDia,
      soloFavoritos: dto.soloFavoritos,
      precioMaximo: 100 // Configurar según necesidades
    });

    // Crear objetos de dominio
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

    // Guardar recomendaciones
    const savedRecomendaciones = await this.recomendacionRepository.saveMany(recomendaciones);

    return {
      recomendaciones: savedRecomendaciones,
      razonamientoGeneral: claudeResult.razonamientoGeneral,
      metadatos: {
        processingTime: Date.now() - startTime,
        usedMCP: true
      }
    };
  }
}