import { PlanNutricional } from '../models/plan-nutricional.model';
import { EstadoPlan } from '@prisma/client';

export abstract class PlanNutricionalRepository {
  abstract save(plan: PlanNutricional): Promise<PlanNutricional>;
  abstract findById(id: string): Promise<PlanNutricional | null>;
  abstract findByClienteId(clienteId: string): Promise<PlanNutricional[]>;
  abstract findActiveByClienteId(clienteId: string): Promise<PlanNutricional | null>;
  abstract findByEstado(estado: EstadoPlan): Promise<PlanNutricional[]>;
  abstract update(plan: PlanNutricional): Promise<PlanNutricional>;
  abstract delete(id: string): Promise<boolean>;
  abstract existsActiveForCliente(clienteId: string): Promise<boolean>;
}