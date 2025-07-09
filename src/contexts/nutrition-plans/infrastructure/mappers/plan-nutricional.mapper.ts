import { PlanNutricional as PrismaPlanNutricional } from '@prisma/client';
import { PlanNutricional, PrimitivePlanNutricional } from '../../domain/models/plan-nutricional.model';
import { Decimal } from '@prisma/client/runtime/library';

export class PlanNutricionalMapper {
  static toDomain(prismaPlanNutricional: PrismaPlanNutricional): PlanNutricional {
    const primitives: PrimitivePlanNutricional = {
      id: prismaPlanNutricional.id,
      clienteId: prismaPlanNutricional.clienteId,
      nombre: prismaPlanNutricional.nombre,
      descripcion: prismaPlanNutricional.descripcion,
      objetivo: prismaPlanNutricional.objetivo,
      estado: prismaPlanNutricional.estado,
      fechaInicio: prismaPlanNutricional.fechaInicio,
      fechaFin: prismaPlanNutricional.fechaFin,
      duracion: prismaPlanNutricional.duracion,
      caloriasObjetivo: prismaPlanNutricional.caloriasObjetivo,
      proteinaObjetivo: prismaPlanNutricional.proteinaObjetivo,
      carbohidratosObjetivo: prismaPlanNutricional.carbohidratosObjetivo,
      grasasObjetivo: prismaPlanNutricional.grasasObjetivo,
      pesoInicial: prismaPlanNutricional.pesoInicial ? Number(prismaPlanNutricional.pesoInicial) : null,
      grasaInicial: prismaPlanNutricional.grasaInicial ? Number(prismaPlanNutricional.grasaInicial) : null,
      muscularInicial: prismaPlanNutricional.muscularInicial ? Number(prismaPlanNutricional.muscularInicial) : null,
      fechaCreacion: prismaPlanNutricional.fechaCreacion,
      fechaActualizacion: prismaPlanNutricional.fechaActualizacion,
    };

    return PlanNutricional.fromPrimitives(primitives);
  }

  static toPrisma(planNutricional: PlanNutricional): Omit<PrismaPlanNutricional, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = planNutricional.toPrimitives();
    
    return {
      id: primitives.id,
      clienteId: primitives.clienteId,
      nombre: primitives.nombre,
      descripcion: primitives.descripcion,
      objetivo: primitives.objetivo,
      estado: primitives.estado,
      fechaInicio: primitives.fechaInicio,
      fechaFin: primitives.fechaFin,
      duracion: primitives.duracion,
      caloriasObjetivo: primitives.caloriasObjetivo,
      proteinaObjetivo: primitives.proteinaObjetivo,
      carbohidratosObjetivo: primitives.carbohidratosObjetivo,
      grasasObjetivo: primitives.grasasObjetivo,
      pesoInicial: primitives.pesoInicial ? Decimal(primitives.pesoInicial) : null,
      grasaInicial: primitives.grasaInicial ? Decimal(primitives.grasaInicial) : null,
      muscularInicial: primitives.muscularInicial ? Decimal(primitives.muscularInicial) : null,
    };
  }

  static toDomainList(prismaPlanes: PrismaPlanNutricional[]): PlanNutricional[] {
    return prismaPlanes.map(this.toDomain);
  }
}