import { RecomendacionNutricional as PrismaRecomendacionNutricional } from '@prisma/client';
import { RecomendacionNutricional, PrimitiveRecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { HorarioUtil } from '../../../../shared/infrastructure/utils/horario.util'; // NUEVO IMPORT

export class RecomendacionNutricionalMapper {
  static toDomain(prismaRecomendacion: PrismaRecomendacionNutricional): RecomendacionNutricional {
    const primitives: PrimitiveRecomendacionNutricional = {
      id: prismaRecomendacion.id,
      mensajeId: prismaRecomendacion.mensajeId,
      productoId: prismaRecomendacion.productoId,
      tamanoId: prismaRecomendacion.tamanoId,
      planId: prismaRecomendacion.planId,
      tituloRecomendacion: prismaRecomendacion.tituloRecomendacion,
      iconoProducto: prismaRecomendacion.iconoProducto,
      timingRecomendado: prismaRecomendacion.timingRecomendado,
      horarioEspecifico: prismaRecomendacion.horarioEspecifico,
      timingAdicional: prismaRecomendacion.timingAdicional,
      prioridad: prismaRecomendacion.prioridad,
      razonamiento: prismaRecomendacion.razonamiento,
      dosis: prismaRecomendacion.dosis,
      frecuencia: prismaRecomendacion.frecuencia,
      respuestaUsuario: prismaRecomendacion.respuestaUsuario,
      timingModificado: prismaRecomendacion.timingModificado,
      fechaCreacion: prismaRecomendacion.fechaCreacion,
      fechaRespuesta: prismaRecomendacion.fechaRespuesta,
    };

    return RecomendacionNutricional.fromPrimitives(primitives);
  }

  static toPrisma(recomendacion: RecomendacionNutricional): Omit<PrismaRecomendacionNutricional, 'fechaCreacion' | 'fechaRespuesta'> {
    const primitives = recomendacion.toPrimitives();
    
    // NUEVO: Validar horarioEspecifico antes de enviarlo a Prisma
    let horarioEspecifico = primitives.horarioEspecifico;
    
    if (horarioEspecifico) {
      // Verificar si es una fecha válida
      if (isNaN(horarioEspecifico.getTime())) {
        console.warn('horarioEspecifico inválido detectado en mapper, estableciendo como null', {
          recomendacionId: primitives.id,
          horarioOriginal: horarioEspecifico
        });
        horarioEspecifico = null;
      }
    }
    
    return {
      id: primitives.id,
      mensajeId: primitives.mensajeId,
      productoId: primitives.productoId,
      tamanoId: primitives.tamanoId,
      planId: primitives.planId,
      tituloRecomendacion: primitives.tituloRecomendacion,
      iconoProducto: primitives.iconoProducto,
      timingRecomendado: primitives.timingRecomendado,
      horarioEspecifico, // ACTUALIZADO: Usar la variable validada
      timingAdicional: primitives.timingAdicional,
      prioridad: primitives.prioridad,
      razonamiento: primitives.razonamiento,
      dosis: primitives.dosis,
      frecuencia: primitives.frecuencia,
      respuestaUsuario: primitives.respuestaUsuario,
      timingModificado: primitives.timingModificado,
    };
  }

  static toDomainList(prismaRecomendaciones: PrismaRecomendacionNutricional[]): RecomendacionNutricional[] {
    return prismaRecomendaciones.map(this.toDomain);
  }
}