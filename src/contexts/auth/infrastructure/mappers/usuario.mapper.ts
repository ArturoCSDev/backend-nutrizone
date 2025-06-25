import { Usuario as PrismaUsuario } from '@prisma/client';
import { Usuario, PrimitiveUsuario } from '../../domain/models/usuario.model';

export class UsuarioMapper {
  static toDomain(prismaUsuario: PrismaUsuario): Usuario {
    const primitives: PrimitiveUsuario = {
      id: prismaUsuario.id,
      email: prismaUsuario.email,
      dni: prismaUsuario.dni,
      password: prismaUsuario.password,
      nombre: prismaUsuario.nombre,
      apellidoPaterno: prismaUsuario.apellidoPaterno,
      apellidoMaterno: prismaUsuario.apellidoMaterno,
      rol: prismaUsuario.rol,
      active: prismaUsuario.active,
      fechaCreacion: prismaUsuario.fechaCreacion,
      fechaActualizacion: prismaUsuario.fechaActualizacion,
    };

    return Usuario.fromPrimitives(primitives);
  }

  static toPrisma(usuario: Usuario): Omit<PrismaUsuario, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = usuario.toPrimitives();
    
    return {
      id: primitives.id,
      email: primitives.email,
      dni: primitives.dni,
      password: primitives.password,
      nombre: primitives.nombre,
      apellidoPaterno: primitives.apellidoPaterno,
      apellidoMaterno: primitives.apellidoMaterno,
      rol: primitives.rol,
      active: primitives.active,
    };
  }

  static toDomainList(prismaUsuarios: PrismaUsuario[]): Usuario[] {
    return prismaUsuarios.map(this.toDomain);
  }
}
