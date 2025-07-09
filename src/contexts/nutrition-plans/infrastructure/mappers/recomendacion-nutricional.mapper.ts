import { RecomendacionNutricional as PrismaRecomendacionNutricional } from '@prisma/client';
import { RecomendacionNutricional, PrimitiveRecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';

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
    
    return {
      id: primitives.id,
      mensajeId: primitives.mensajeId,
      productoId: primitives.productoId,
      tamanoId: primitives.tamanoId,
      planId: primitives.planId,
      tituloRecomendacion: primitives.tituloRecomendacion,
      iconoProducto: primitives.iconoProducto,
      timingRecomendado: primitives.timingRecomendado,
      horarioEspecifico: primitives.horarioEspecifico,
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