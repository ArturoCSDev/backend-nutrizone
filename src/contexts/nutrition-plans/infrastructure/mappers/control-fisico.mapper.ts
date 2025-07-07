import { Prisma, ControlFisico as PrismaControlFisico } from '@prisma/client';
import { ControlFisico, PrimitiveControlFisico, MedidasAdicionales } from '../../domain/models/control-fisico.model';

type ControlFisicoData = {
  id?: string;
  clienteId: string;
  planId?: string | null;
  fechaControl: Date;
  peso?: Prisma.Decimal | null;
  grasaCorporal?: Prisma.Decimal | null;
  masaMuscular?: Prisma.Decimal | null;
  medidasAdicionales?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
  nivelEnergia?: number | null;
  estadoAnimo?: number | null;
  notas?: string | null;
  realizadoPor?: string | null;
  proximaCita?: Date | null;
} & (
  | { id: string }
  | { clienteId: string }
);

export class ControlFisicoMapper {
  static toDomain(prismaControlFisico: PrismaControlFisico): ControlFisico {
    const primitives: PrimitiveControlFisico = {
      id: prismaControlFisico.id,
      clienteId: prismaControlFisico.clienteId,
      planId: prismaControlFisico.planId,
      fechaControl: prismaControlFisico.fechaControl,
      peso: prismaControlFisico.peso,
      grasaCorporal: prismaControlFisico.grasaCorporal,
      masaMuscular: prismaControlFisico.masaMuscular,
      medidasAdicionales: prismaControlFisico.medidasAdicionales as MedidasAdicionales,
      nivelEnergia: prismaControlFisico.nivelEnergia,
      estadoAnimo: prismaControlFisico.estadoAnimo,
      notas: prismaControlFisico.notas,
      realizadoPor: prismaControlFisico.realizadoPor,
      proximaCita: prismaControlFisico.proximaCita,
      fechaCreacion: prismaControlFisico.fechaCreacion,
      fechaActualizacion: prismaControlFisico.fechaActualizacion,
    };

    return ControlFisico.fromPrimitives(primitives);
  }

  static toPrisma(controlFisico: ControlFisico): ControlFisicoData {
    const primitives = controlFisico.toPrimitives();
    
    const baseData = {
      id: primitives.id,
      clienteId: primitives.clienteId,
      planId: primitives.planId,
      fechaControl: primitives.fechaControl,
      peso: primitives.peso,
      grasaCorporal: primitives.grasaCorporal,
      masaMuscular: primitives.masaMuscular,
      nivelEnergia: primitives.nivelEnergia,
      estadoAnimo: primitives.estadoAnimo,
      notas: primitives.notas,
      realizadoPor: primitives.realizadoPor,
      proximaCita: primitives.proximaCita,
      medidasAdicionales: primitives.medidasAdicionales === null ? Prisma.NullableJsonNullValueInput : primitives.medidasAdicionales
    };

    return baseData;
  }

  static toDomainList(prismaControlesFisicos: PrismaControlFisico[]): ControlFisico[] {
    return prismaControlesFisicos.map(this.toDomain);
  }
}