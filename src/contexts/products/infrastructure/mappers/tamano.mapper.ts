import { Tamano as PrismaTamano } from '@prisma/client';
import { Tamano, PrimitiveTamano } from '../../domain/models/tamano.model';

export class TamanoMapper {
  static toDomain(prismaTamano: PrismaTamano): Tamano {
    const primitiveTamano: PrimitiveTamano = {
      id: prismaTamano.id,
      nombre: prismaTamano.nombre,
      volumen: prismaTamano.volumen,
      proteina: prismaTamano.proteina,
      fechaCreacion: prismaTamano.fechaCreacion,
      fechaActualizacion: prismaTamano.fechaActualizacion
    };

    return Tamano.fromPrimitives(primitiveTamano);
  }

  static toPrisma(tamano: Tamano): Omit<PrismaTamano, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = tamano.toPrimitives();
    
    return {
      id: primitives.id,
      nombre: primitives.nombre,
      volumen: primitives.volumen,
      proteina: primitives.proteina
    };
  }

  static toDomainList(prismaTamanos: PrismaTamano[]): Tamano[] {
    return prismaTamanos.map(TamanoMapper.toDomain);
  }

  static toResponse(tamano: Tamano) {
    return {
      id: tamano.id,
      nombre: tamano.nombre,
      volumen: tamano.volumen,
      proteina: tamano.proteina,
      fechaCreacion: tamano.fechaCreacion,
      fechaActualizacion: tamano.fechaActualizacion,
      // Campos adicionales para el frontend
      volumenEnLitros: tamano.getVolumenEnLitros(),
      proteinaPorMl: Number(tamano.getProteinaPorMl().toFixed(3)),
      esPequeno: tamano.isPequeno(),
      esMediano: tamano.isMediano(),
      esGrande: tamano.isGrande(),
      esAltaProteina: tamano.isAltaProteina(),
      // Información descriptiva
      categoria: tamano.isPequeno() ? 'Pequeño' : tamano.isMediano() ? 'Mediano' : 'Grande',
      descripcionProteina: tamano.isAltaProteina() ? 'Alta en proteína' : 'Proteína estándar'
    };
  }
}