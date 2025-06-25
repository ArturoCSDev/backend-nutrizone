import { Cliente as PrismaCliente } from '@prisma/client';
import { Cliente, PrimitiveCliente } from '../../domain/models/cliente.model';

export class ClienteMapper {
  static toDomain(prismaCliente: PrismaCliente): Cliente {
    const primitives: PrimitiveCliente = {
      id: prismaCliente.id,
      usuarioId: prismaCliente.usuarioId,
      edad: prismaCliente.edad,
      peso: prismaCliente.peso,
      altura: prismaCliente.altura,
      nivelActividad: prismaCliente.nivelActividad,
      telefono: prismaCliente.telefono,
      fechaNacimiento: prismaCliente.fechaNacimiento,
      genero: prismaCliente.genero,
      grasaCorporal: prismaCliente.grasaCorporal,
      masaMuscular: prismaCliente.masaMuscular,
      metabolismoBasal: prismaCliente.metabolismoBasal,
      fechaCreacion: prismaCliente.fechaCreacion,
      fechaActualizacion: prismaCliente.fechaActualizacion,
    };

    return Cliente.fromPrimitives(primitives);
  }

  static toPrisma(cliente: Cliente): Omit<PrismaCliente, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = cliente.toPrimitives();
    
    return {
      id: primitives.id,
      usuarioId: primitives.usuarioId,
      edad: primitives.edad,
      peso: primitives.peso,
      altura: primitives.altura,
      nivelActividad: primitives.nivelActividad,
      telefono: primitives.telefono,
      fechaNacimiento: primitives.fechaNacimiento,
      genero: primitives.genero,
      grasaCorporal: primitives.grasaCorporal,
      masaMuscular: primitives.masaMuscular,
      metabolismoBasal: primitives.metabolismoBasal,
    };
  }

  static toDomainList(prismaClientes: PrismaCliente[]): Cliente[] {
    return prismaClientes.map(this.toDomain);
  }
}
