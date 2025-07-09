import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { RecomendacionNutricionalRepository } from '../../domain/repositories/recomendacion-nutricional.repository';
import { RecomendacionNutricional } from '../../domain/models/recomendacion-nutricional.model';
import { RecomendacionNutricionalMapper } from '../mappers/recomendacion-nutricional.mapper';
import { Prioridad, RespuestaUsuario } from '@prisma/client';

export class PrismaRecomendacionNutricionalRepository extends RecomendacionNutricionalRepository {
  async save(recomendacion: RecomendacionNutricional): Promise<RecomendacionNutricional> {
    const prismaRecomendacion = await prisma.recomendacionNutricional.create({
      data: RecomendacionNutricionalMapper.toPrisma(recomendacion),
    });
    return RecomendacionNutricionalMapper.toDomain(prismaRecomendacion);
  }

  async saveMany(recomendaciones: RecomendacionNutricional[]): Promise<RecomendacionNutricional[]> {
    const prismaData = recomendaciones.map(rec => RecomendacionNutricionalMapper.toPrisma(rec));
    
    // Usar createMany para insertar múltiples registros de forma eficiente
    await prisma.recomendacionNutricional.createMany({
      data: prismaData,
    });

    // Obtener los registros creados para retornarlos
    const ids = recomendaciones.map(rec => rec.id);
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: { id: { in: ids } },
      orderBy: { fechaCreacion: 'desc' },
    });

    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }

  async update(recomendacion: RecomendacionNutricional): Promise<RecomendacionNutricional> {
    const prismaRecomendacion = await prisma.recomendacionNutricional.update({
      where: { id: recomendacion.id },
      data: RecomendacionNutricionalMapper.toPrisma(recomendacion),
    });
    return RecomendacionNutricionalMapper.toDomain(prismaRecomendacion);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.recomendacionNutricional.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findById(id: string): Promise<RecomendacionNutricional | null> {
    const prismaRecomendacion = await prisma.recomendacionNutricional.findUnique({
      where: { id },
    });
    return prismaRecomendacion ? RecomendacionNutricionalMapper.toDomain(prismaRecomendacion) : null;
  }

  async findByMensajeId(mensajeId: string): Promise<RecomendacionNutricional[]> {
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: { mensajeId },
      orderBy: { fechaCreacion: 'desc' },
    });
    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }

  async findByPlanId(planId: string): Promise<RecomendacionNutricional[]> {
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: { planId },
      orderBy: { prioridad: 'asc', fechaCreacion: 'desc' },
    });
    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }

  async findByClienteId(clienteId: string): Promise<RecomendacionNutricional[]> {
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: {
        plan: {
          clienteId: clienteId,
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });
    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }

  async findByPrioridad(prioridad: Prioridad): Promise<RecomendacionNutricional[]> {
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: { prioridad },
      orderBy: { fechaCreacion: 'desc' },
    });
    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }

  async findByRespuestaUsuario(respuesta: RespuestaUsuario): Promise<RecomendacionNutricional[]> {
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: { respuestaUsuario: respuesta },
      orderBy: { fechaCreacion: 'desc' },
    });
    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }

  async findPendingByClienteId(clienteId: string): Promise<RecomendacionNutricional[]> {
    const prismaRecomendaciones = await prisma.recomendacionNutricional.findMany({
      where: {
        respuestaUsuario: RespuestaUsuario.PENDIENTE,
        plan: {
          clienteId: clienteId,
        },
      },
      orderBy: { prioridad: 'asc', fechaCreacion: 'desc' },
    });
    return RecomendacionNutricionalMapper.toDomainList(prismaRecomendaciones);
  }
}