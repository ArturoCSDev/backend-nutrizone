import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { Administrador } from '../../domain/models/administrador.model';
import { AdministradorMapper } from '../mappers/administrador.mapper';

export class PrismaAdministradorRepository extends AdministradorRepository {
  async save(administrador: Administrador): Promise<Administrador> {
    const prismaAdministrador = await prisma.administrador.create({
      data: AdministradorMapper.toPrisma(administrador),
    });
    return AdministradorMapper.toDomain(prismaAdministrador);
  }

  async update(administrador: Administrador): Promise<Administrador> {
    const prismaAdministrador = await prisma.administrador.update({
      where: { id: administrador.id },
      data: AdministradorMapper.toPrisma(administrador),
    });
    return AdministradorMapper.toDomain(prismaAdministrador);
  }

  async delete(id: string): Promise<void> {
    await prisma.administrador.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Administrador | null> {
    const prismaAdministrador = await prisma.administrador.findUnique({
      where: { id },
    });
    return prismaAdministrador ? AdministradorMapper.toDomain(prismaAdministrador) : null;
  }

  async findByIds(ids: string[]): Promise<Administrador[]> {
    const prismaAdministradores = await prisma.administrador.findMany({
      where: { id: { in: ids } },
    });
    return AdministradorMapper.toDomainList(prismaAdministradores);
  }

  async findMany(): Promise<Administrador[]> {
    const prismaAdministradores = await prisma.administrador.findMany({
      orderBy: { fechaCreacion: 'desc' },
    });
    return AdministradorMapper.toDomainList(prismaAdministradores);
  }

  async findByUsuarioId(usuarioId: string): Promise<Administrador | null> {
    const prismaAdministrador = await prisma.administrador.findUnique({
      where: { usuarioId },
    });
    return prismaAdministrador ? AdministradorMapper.toDomain(prismaAdministrador) : null;
  }
}
