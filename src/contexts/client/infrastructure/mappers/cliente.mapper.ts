import { Cliente as PrismaCliente, Usuario } from '@prisma/client';
import { Cliente, PrimitiveCliente } from '../../domain/models/cliente.model';

type PrismaClienteWithUsuario = PrismaCliente & {
  cliente: Usuario;
};

export class ClienteMapper {
  static toDomain(prismaCliente: PrismaCliente | PrismaClienteWithUsuario): Cliente {
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

    const clienteInstance = Cliente.fromPrimitives(primitives);
    
    if ('cliente' in prismaCliente && prismaCliente.cliente) {
      (clienteInstance as any).usuario = prismaCliente.cliente;
    }

    return clienteInstance;
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

  static toDomainList(prismaClientes: (PrismaCliente | PrismaClienteWithUsuario)[]): Cliente[] {
    return prismaClientes.map(this.toDomain);
  }
}
