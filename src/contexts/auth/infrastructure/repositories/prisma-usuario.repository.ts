import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Usuario } from '../../domain/models/usuario.model';
import { UsuarioMapper } from '../mappers/usuario.mapper';

export class PrismaUsuarioRepository extends UsuarioRepository {
  async save(usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await prisma.usuario.create({
      data: UsuarioMapper.toPrisma(usuario),
    });
    return UsuarioMapper.toDomain(prismaUsuario);
  }

  async update(usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: UsuarioMapper.toPrisma(usuario),
    });
    return UsuarioMapper.toDomain(prismaUsuario);
  }

  async delete(id: string): Promise<void> {
    await prisma.usuario.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    const prismaUsuario = await prisma.usuario.findUnique({
      where: { id },
    });
    return prismaUsuario ? UsuarioMapper.toDomain(prismaUsuario) : null;
  }

  async findByIds(ids: string[]): Promise<Usuario[]> {
    const prismaUsuarios = await prisma.usuario.findMany({
      where: { id: { in: ids } },
    });
    return UsuarioMapper.toDomainList(prismaUsuarios);
  }

  async findMany(): Promise<Usuario[]> {
    const prismaUsuarios = await prisma.usuario.findMany({
      orderBy: { fechaCreacion: 'desc' },
    });
    return UsuarioMapper.toDomainList(prismaUsuarios);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const prismaUsuario = await prisma.usuario.findUnique({
      where: { email },
    });
    return prismaUsuario ? UsuarioMapper.toDomain(prismaUsuario) : null;
  }

  async findByDni(dni: string): Promise<Usuario | null> {
    const prismaUsuario = await prisma.usuario.findUnique({
      where: { dni },
    });
    return prismaUsuario ? UsuarioMapper.toDomain(prismaUsuario) : null;
  }
}
