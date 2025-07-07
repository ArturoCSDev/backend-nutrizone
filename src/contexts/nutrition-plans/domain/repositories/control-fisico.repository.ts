import { ControlFisico } from '../models/control-fisico.model';

export abstract class ControlFisicoRepository {
  abstract save(controlFisico: ControlFisico): Promise<ControlFisico>;
  abstract update(controlFisico: ControlFisico): Promise<ControlFisico>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<ControlFisico | null>;
  abstract findByIds(ids: string[]): Promise<ControlFisico[]>;
  abstract findMany(): Promise<ControlFisico[]>;
  abstract findByClienteId(clienteId: string): Promise<ControlFisico[]>;
  abstract findByClienteIdAndFecha(clienteId: string, fecha: Date): Promise<ControlFisico | null>;
  abstract findByPlanId(planId: string): Promise<ControlFisico[]>;
  abstract findRecentByClienteId(clienteId: string, days: number): Promise<ControlFisico[]>;
  abstract findByDateRange(clienteId: string, startDate: Date, endDate: Date): Promise<ControlFisico[]>;
}