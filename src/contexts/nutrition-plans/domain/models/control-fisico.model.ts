import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

export interface MedidasAdicionales {
  [key: string]: string;
}

export interface PrimitiveControlFisico {
  id: string;
  clienteId: string;
  planId: string | null;
  fechaControl: Date;
  peso: Decimal | null;
  grasaCorporal: Decimal | null;
  masaMuscular: Decimal | null;
  medidasAdicionales: any | null;
  nivelEnergia: number | null;
  estadoAnimo: number | null;
  notas: string | null;
  realizadoPor: string | null;
  proximaCita: Date | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class ControlFisico {
  private constructor(private readonly _attributes: PrimitiveControlFisico) {}

  static create(
    createControlFisico: Omit<PrimitiveControlFisico, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): ControlFisico {
    const now = new Date();

    return new ControlFisico({
      id: crypto.randomUUID(),
      ...createControlFisico,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitiveControlFisico): ControlFisico {
    return new ControlFisico(primitives);
  }

  // Getters básicos
  get id(): string {
    return this._attributes.id;
  }

  get clienteId(): string {
    return this._attributes.clienteId;
  }

  get planId(): string | null {
    return this._attributes.planId;
  }

  get fechaControl(): Date {
    return this._attributes.fechaControl;
  }

  get peso(): Decimal | null {
    return this._attributes.peso;
  }

  get grasaCorporal(): Decimal | null {
    return this._attributes.grasaCorporal;
  }

  get masaMuscular(): Decimal | null {
    return this._attributes.masaMuscular;
  }

  get medidasAdicionales(): any | null {
    return this._attributes.medidasAdicionales;
  }

  get nivelEnergia(): number | null {
    return this._attributes.nivelEnergia;
  }

  get estadoAnimo(): number | null {
    return this._attributes.estadoAnimo;
  }

  get notas(): string | null {
    return this._attributes.notas;
  }

  get realizadoPor(): string | null {
    return this._attributes.realizadoPor;
  }

  get proximaCita(): Date | null {
    return this._attributes.proximaCita;
  }

  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }

  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }

  // Getters calculados
  get imc(): number | null {
    if (!this.peso) return null;
    // Necesitaríamos la altura del cliente para calcular el IMC
    // Este método podría recibir la altura como parámetro o 
    // requerir una relación con el cliente
    return null;
  }

  get tieneMetricasFisicas(): boolean {
    return !!(this.peso || this.grasaCorporal || this.masaMuscular);
  }

  get tieneEvaluacionSubjetiva(): boolean {
    return !!(this.nivelEnergia || this.estadoAnimo);
  }

  get diasDesdeControl(): number {
    const today = new Date();
    const controlDate = new Date(this.fechaControl);
    const diffTime = Math.abs(today.getTime() - controlDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Métodos de negocio
  hasCompleteMetrics(): boolean {
    return !!(this.peso && this.grasaCorporal && this.masaMuscular);
  }

  hasSubjectiveEvaluation(): boolean {
    return !!(this.nivelEnergia && this.estadoAnimo);
  }

  isRecentControl(): boolean {
    return this.diasDesdeControl <= 7;
  }

  needsFollowUp(): boolean {
    return !!this.proximaCita && new Date() >= this.proximaCita;
  }

  // Validaciones para ratings
  isValidNivelEnergia(): boolean {
    return this.nivelEnergia ? this.nivelEnergia >= 1 && this.nivelEnergia <= 5 : true;
  }

  isValidEstadoAnimo(): boolean {
    return this.estadoAnimo ? this.estadoAnimo >= 1 && this.estadoAnimo <= 5 : true;
  }

  // Métodos de actualización
  updateMetricasFisicas(data: {
    peso?: Decimal;
    grasaCorporal?: Decimal;
    masaMuscular?: Decimal;
    medidasAdicionales?: any;
  }): ControlFisico {
    return new ControlFisico({
      ...this._attributes,
      ...data,
      fechaActualizacion: new Date()
    });
  }

  updateEvaluacionSubjetiva(data: {
    nivelEnergia?: number;
    estadoAnimo?: number;
    notas?: string;
  }): ControlFisico {
    return new ControlFisico({
      ...this._attributes,
      ...data,
      fechaActualizacion: new Date()
    });
  }

  updateAdministrativo(data: {
    realizadoPor?: string;
    proximaCita?: Date;
  }): ControlFisico {
    return new ControlFisico({
      ...this._attributes,
      ...data,
      fechaActualizacion: new Date()
    });
  }

  assignToPlan(planId: string): ControlFisico {
    return new ControlFisico({
      ...this._attributes,
      planId,
      fechaActualizacion: new Date()
    });
  }

  toPrimitives(): PrimitiveControlFisico {
    return { ...this._attributes };
  }
}