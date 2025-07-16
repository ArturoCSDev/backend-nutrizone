import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ControlFisico } from '../../domain/models/control-fisico.model';
import { ControlFisicoMapper } from '../mappers/control-fisico.mapper';

export class PrismaControlFisicoRepository extends ControlFisicoRepository {
  async save(controlFisico: ControlFisico): Promise<ControlFisico> {
    const prismaControlFisico = await prisma.controlFisico.create({
      data: ControlFisicoMapper.toPrisma(controlFisico),
    });
    return ControlFisicoMapper.toDomain(prismaControlFisico);
  }

  async update(controlFisico: ControlFisico): Promise<ControlFisico> {
    const prismaControlFisico = await prisma.controlFisico.update({
      where: { id: controlFisico.id },
      data: ControlFisicoMapper.toPrisma(controlFisico),
    });
    return ControlFisicoMapper.toDomain(prismaControlFisico);
  }

  async delete(id: string): Promise<void> {
    await prisma.controlFisico.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<ControlFisico | null> {
    const prismaControlFisico = await prisma.controlFisico.findUnique({
      where: { id },
    });
    return prismaControlFisico ? ControlFisicoMapper.toDomain(prismaControlFisico) : null;
  }

  async findByIds(ids: string[]): Promise<ControlFisico[]> {
    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      where: { id: { in: ids } },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }

  async findMany(): Promise<ControlFisico[]> {
    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      orderBy: { fechaControl: 'desc' },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }

  async findByClienteId(clienteId: string): Promise<ControlFisico[]> {
    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      where: { clienteId },
      orderBy: { fechaControl: 'desc' },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }

  async findByClienteIdAndFecha(clienteId: string, fecha: Date): Promise<ControlFisico | null> {
    const prismaControlFisico = await prisma.controlFisico.findUnique({
      where: { 
        clienteId_fechaControl: {
          clienteId,
          fechaControl: fecha
        }
      },
    });
    return prismaControlFisico ? ControlFisicoMapper.toDomain(prismaControlFisico) : null;
  }

  async findByPlanId(planId: string): Promise<ControlFisico[]> {
    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      where: { planId },
      orderBy: { fechaControl: 'desc' },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }

  async findRecentByClienteId(clienteId: string, days: number): Promise<ControlFisico[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      where: { 
        clienteId,
        fechaControl: {
          gte: startDate
        }
      },
      orderBy: { fechaControl: 'desc' },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }

  async findByDateRange(clienteId: string, startDate: Date, endDate: Date): Promise<ControlFisico[]> {
    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      where: {
        clienteId,
        fechaControl: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { fechaControl: 'desc' },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }

   async findByClienteIdWithDateRange(
    clienteId: string, 
    fechaInicio: Date, 
    fechaFin: Date
  ): Promise<ControlFisico[]> {
    const prismaControlesFisicos = await prisma.controlFisico.findMany({
      where: {
        clienteId,
        fechaControl: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        cliente: true,
      },
      orderBy: { fechaControl: 'desc' },
    });
    return ControlFisicoMapper.toDomainList(prismaControlesFisicos);
  }
}