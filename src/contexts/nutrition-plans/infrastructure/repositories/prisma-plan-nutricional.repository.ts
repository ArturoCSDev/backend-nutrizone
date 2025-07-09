import { prisma } from '../../../../shared/infrastructure/adapters/prisma/prisma.client';
import { PlanNutricionalRepository } from '../../domain/repositories/plan-nutricional.repository';
import { PlanNutricional } from '../../domain/models/plan-nutricional.model';
import { PlanNutricionalMapper } from '../mappers/plan-nutricional.mapper';
import { EstadoPlan } from '@prisma/client';

export class PrismaPlanNutricionalRepository extends PlanNutricionalRepository {
  async save(plan: PlanNutricional): Promise<PlanNutricional> {
    const prismaPlan = await prisma.planNutricional.create({
      data: PlanNutricionalMapper.toPrisma(plan),
    });
    return PlanNutricionalMapper.toDomain(prismaPlan);
  }

  async update(plan: PlanNutricional): Promise<PlanNutricional> {
    const prismaPlan = await prisma.planNutricional.update({
      where: { id: plan.id },
      data: PlanNutricionalMapper.toPrisma(plan),
    });
    return PlanNutricionalMapper.toDomain(prismaPlan);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.planNutricional.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findById(id: string): Promise<PlanNutricional | null> {
    const prismaPlan = await prisma.planNutricional.findUnique({
      where: { id },
    });
    return prismaPlan ? PlanNutricionalMapper.toDomain(prismaPlan) : null;
  }

  async findByClienteId(clienteId: string): Promise<PlanNutricional[]> {
    const prismaPlanes = await prisma.planNutricional.findMany({
      where: { clienteId },
      orderBy: { fechaCreacion: 'desc' },
    });
    return PlanNutricionalMapper.toDomainList(prismaPlanes);
  }

  async findActiveByClienteId(clienteId: string): Promise<PlanNutricional | null> {
    const prismaPlan = await prisma.planNutricional.findFirst({
      where: { 
        clienteId,
        estado: EstadoPlan.ACTIVO 
      },
      orderBy: { fechaCreacion: 'desc' },
    });
    return prismaPlan ? PlanNutricionalMapper.toDomain(prismaPlan) : null;
  }

  async findByEstado(estado: EstadoPlan): Promise<PlanNutricional[]> {
    const prismaPlanes = await prisma.planNutricional.findMany({
      where: { estado },
      orderBy: { fechaCreacion: 'desc' },
    });
    return PlanNutricionalMapper.toDomainList(prismaPlanes);
  }

  async existsActiveForCliente(clienteId: string): Promise<boolean> {
    const count = await prisma.planNutricional.count({
      where: { 
        clienteId,
        estado: EstadoPlan.ACTIVO 
      },
    });
    return count > 0;
  }
}