import { Sabor as PrismaSabor } from '@prisma/client';
import { Sabor, PrimitiveSabor } from '../../domain/models/sabor.model';

export class SaborMapper {
  static toDomain(prismaSabor: PrismaSabor): Sabor {
    const primitiveSabor: PrimitiveSabor = {
      id: prismaSabor.id,
      nombre: prismaSabor.nombre,
      descripcion: prismaSabor.descripcion,
      fechaCreacion: prismaSabor.fechaCreacion,
      fechaActualizacion: prismaSabor.fechaActualizacion
    };

    return Sabor.fromPrimitives(primitiveSabor);
  }

  static toPrisma(sabor: Sabor): Omit<PrismaSabor, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = sabor.toPrimitives();
    
    return {
      id: primitives.id,
      nombre: primitives.nombre,
      descripcion: primitives.descripcion
    };
  }

  static toDomainList(prismaSabores: PrismaSabor[]): Sabor[] {
    return prismaSabores.map(SaborMapper.toDomain);
  }

  static toResponse(sabor: Sabor) {
    return {
      id: sabor.id,
      nombre: sabor.nombre,
      descripcion: sabor.descripcion,
      fechaCreacion: sabor.fechaCreacion,
      fechaActualizacion: sabor.fechaActualizacion,
      // Campos adicionales para el frontend
      tieneDescripcion: sabor.hasDescripcion()
    };
  }
}