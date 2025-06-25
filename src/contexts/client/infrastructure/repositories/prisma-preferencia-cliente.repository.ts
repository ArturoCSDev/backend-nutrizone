import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { PreferenciaClienteRepository } from '../../domain/repositories/preferencia-cliente.repository';
import { PreferenciaCliente } from '../../domain/models/preferencia-cliente.model';
import { PreferenciaClienteMapper } from '../mappers/preferencia-cliente.mapper';

export class PrismaPreferenciaClienteRepository extends PreferenciaClienteRepository {
  async save(preferencia: PreferenciaCliente): Promise<PreferenciaCliente> {
    const prismaPreferencia = await prisma.preferenciaCliente.create({
      data: PreferenciaClienteMapper.toPrisma(preferencia),
    });
    return PreferenciaClienteMapper.toDomain(prismaPreferencia);
  }

  async update(preferencia: PreferenciaCliente): Promise<PreferenciaCliente> {
    const prismaPreferencia = await prisma.preferenciaCliente.update({
      where: { id: preferencia.id },
      data: PreferenciaClienteMapper.toPrisma(preferencia),
    });
    return PreferenciaClienteMapper.toDomain(prismaPreferencia);
  }

  async delete(id: string): Promise<void> {
    await prisma.preferenciaCliente.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<PreferenciaCliente | null> {
    const prismaPreferencia = await prisma.preferenciaCliente.findUnique({
      where: { id },
    });
    return prismaPreferencia ? PreferenciaClienteMapper.toDomain(prismaPreferencia) : null;
  }

  async findByIds(ids: string[]): Promise<PreferenciaCliente[]> {
    const prismaPreferencias = await prisma.preferenciaCliente.findMany({
      where: { id: { in: ids } },
    });
    return PreferenciaClienteMapper.toDomainList(prismaPreferencias);
  }

  async findMany(): Promise<PreferenciaCliente[]> {
    const prismaPreferencias = await prisma.preferenciaCliente.findMany({
      orderBy: { fechaCreacion: 'desc' },
    });
    return PreferenciaClienteMapper.toDomainList(prismaPreferencias);
  }

  async findByClienteId(clienteId: string): Promise<PreferenciaCliente | null> {
    const prismaPreferencia = await prisma.preferenciaCliente.findUnique({
      where: { clienteId },
    });
    return prismaPreferencia ? PreferenciaClienteMapper.toDomain(prismaPreferencia) : null;
  }
}
