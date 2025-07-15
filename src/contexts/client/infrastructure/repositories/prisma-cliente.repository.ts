import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { Cliente } from '../../domain/models/cliente.model';
import { ClienteMapper } from '../mappers/cliente.mapper';

export class PrismaClienteRepository extends ClienteRepository {
  async save(cliente: Cliente): Promise<Cliente> {
    const prismaCliente = await prisma.cliente.create({
      data: ClienteMapper.toPrisma(cliente),
      include: {
        cliente: true
      }
    });
    return ClienteMapper.toDomain(prismaCliente);
  }

  async update(cliente: Cliente): Promise<Cliente> {
    const prismaCliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: ClienteMapper.toPrisma(cliente),
      include: {
        cliente: true
      }
    });
    return ClienteMapper.toDomain(prismaCliente);
  }

  async delete(id: string): Promise<void> {
    await prisma.cliente.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Cliente | null> {
    const prismaCliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        cliente: true
      }
    });
    return prismaCliente ? ClienteMapper.toDomain(prismaCliente) : null;
  }

  async findByIds(ids: string[]): Promise<Cliente[]> {
    const prismaClientes = await prisma.cliente.findMany({
      where: { id: { in: ids } },
      include: {
        cliente: true
      }
    });
    return ClienteMapper.toDomainList(prismaClientes);
  }

  async findMany(): Promise<Cliente[]> {
    const prismaClientes = await prisma.cliente.findMany({
      orderBy: { fechaCreacion: 'desc' },
      include: {
        cliente: true
      }
    });
    return ClienteMapper.toDomainList(prismaClientes);
  }

  async findByUsuarioId(usuarioId: string): Promise<Cliente | null> {
    const prismaCliente = await prisma.cliente.findUnique({
      where: { usuarioId },
      include: {
        cliente: true
      }
    });
    return prismaCliente ? ClienteMapper.toDomain(prismaCliente) : null;
  }
}
