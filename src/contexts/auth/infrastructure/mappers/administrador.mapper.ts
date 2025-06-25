import { Administrador as PrismaAdministrador } from '@prisma/client';
import { Administrador, PrimitiveAdministrador } from '../../domain/models/administrador.model';

export class AdministradorMapper {
  static toDomain(prismaAdministrador: PrismaAdministrador): Administrador {
    const primitives: PrimitiveAdministrador = {
      id: prismaAdministrador.id,
      usuarioId: prismaAdministrador.usuarioId,
      departamento: prismaAdministrador.departamento,
      nivelAcceso: prismaAdministrador.nivelAcceso,
      ultimoAcceso: prismaAdministrador.ultimoAcceso,
      fechaCreacion: prismaAdministrador.fechaCreacion,
      fechaActualizacion: prismaAdministrador.fechaActualizacion,
    };

    return Administrador.fromPrimitives(primitives);
  }

  static toPrisma(administrador: Administrador): Omit<PrismaAdministrador, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = administrador.toPrimitives();
    
    return {
      id: primitives.id,
      usuarioId: primitives.usuarioId,
      departamento: primitives.departamento,
      nivelAcceso: primitives.nivelAcceso,
      ultimoAcceso: primitives.ultimoAcceso,
    };
  }

  static toDomainList(prismaAdministradores: PrismaAdministrador[]): Administrador[] {
    return prismaAdministradores.map(this.toDomain);
  }
}
