import { RecomendacionNutricional } from '../models/recomendacion-nutricional.model';
import { Prioridad, RespuestaUsuario } from '@prisma/client';

export abstract class RecomendacionNutricionalRepository {
  abstract save(recomendacion: RecomendacionNutricional): Promise<RecomendacionNutricional>;
  abstract saveMany(recomendaciones: RecomendacionNutricional[]): Promise<RecomendacionNutricional[]>;
  abstract findById(id: string): Promise<RecomendacionNutricional | null>;
  abstract findByMensajeId(mensajeId: string): Promise<RecomendacionNutricional[]>;
  abstract findByPlanId(planId: string): Promise<RecomendacionNutricional[]>;
  abstract findByClienteId(clienteId: string): Promise<RecomendacionNutricional[]>;
  abstract findByPrioridad(prioridad: Prioridad): Promise<RecomendacionNutricional[]>;
  abstract findByRespuestaUsuario(respuesta: RespuestaUsuario): Promise<RecomendacionNutricional[]>;
  abstract findPendingByClienteId(clienteId: string): Promise<RecomendacionNutricional[]>;
  abstract update(recomendacion: RecomendacionNutricional): Promise<RecomendacionNutricional>;
  abstract delete(id: string): Promise<boolean>;
}