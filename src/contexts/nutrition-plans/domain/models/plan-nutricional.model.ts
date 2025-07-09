import { ObjetivoNutricional, EstadoPlan } from '@prisma/client';

export interface PrimitivePlanNutricional {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion: string | null;
  objetivo: ObjetivoNutricional;
  estado: EstadoPlan;
  fechaInicio: Date;
  fechaFin: Date | null;
  duracion: number | null;
  caloriasObjetivo: number | null;
  proteinaObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  pesoInicial: number | null;
  grasaInicial: number | null;
  muscularInicial: number | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class PlanNutricional {
  private constructor(private readonly _attributes: PrimitivePlanNutricional) {}

  static create(
    createPlan: Omit<PrimitivePlanNutricional, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): PlanNutricional {
    const now = new Date();
    return new PlanNutricional({
      id: crypto.randomUUID(),
      ...createPlan,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitivePlanNutricional): PlanNutricional {
    return new PlanNutricional(primitives);
  }

  // Getters básicos
  get id(): string { 
    return this._attributes.id; 
  }

  get clienteId(): string { 
    return this._attributes.clienteId; 
  }

  get nombre(): string { 
    return this._attributes.nombre; 
  }

  get descripcion(): string | null { 
    return this._attributes.descripcion; 
  }

  get objetivo(): ObjetivoNutricional { 
    return this._attributes.objetivo; 
  }

  get estado(): EstadoPlan { 
    return this._attributes.estado; 
  }

  get fechaInicio(): Date { 
    return this._attributes.fechaInicio; 
  }

  get fechaFin(): Date | null { 
    return this._attributes.fechaFin; 
  }

  get duracion(): number | null { 
    return this._attributes.duracion; 
  }

  get caloriasObjetivo(): number | null { 
    return this._attributes.caloriasObjetivo; 
  }

  get proteinaObjetivo(): number | null { 
    return this._attributes.proteinaObjetivo; 
  }

  get carbohidratosObjetivo(): number | null { 
    return this._attributes.carbohidratosObjetivo; 
  }

  get grasasObjetivo(): number | null { 
    return this._attributes.grasasObjetivo; 
  }

  get pesoInicial(): number | null { 
    return this._attributes.pesoInicial; 
  }

  get grasaInicial(): number | null { 
    return this._attributes.grasaInicial; 
  }

  get muscularInicial(): number | null { 
    return this._attributes.muscularInicial; 
  }

  get fechaCreacion(): Date { 
    return this._attributes.fechaCreacion; 
  }

  get fechaActualizacion(): Date { 
    return this._attributes.fechaActualizacion; 
  }

  // Getters compuestos
  get isActive(): boolean {
    return this.estado === EstadoPlan.ACTIVO;
  }

  get isCompleted(): boolean {
    return this.estado === EstadoPlan.COMPLETADO;
  }

  get isPaused(): boolean {
    return this.estado === EstadoPlan.PAUSADO;
  }

  get isCanceled(): boolean {
    return this.estado === EstadoPlan.CANCELADO;
  }

  get daysRemaining(): number | null {
    if (!this.fechaFin) return null;
    const today = new Date();
    const diffTime = this.fechaFin.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Métodos de negocio
  canBeModified(): boolean {
    return this.estado === EstadoPlan.ACTIVO || this.estado === EstadoPlan.PAUSADO;
  }

  canBeCompleted(): boolean {
    return this.estado === EstadoPlan.ACTIVO;
  }

  canBePaused(): boolean {
    return this.estado === EstadoPlan.ACTIVO;
  }

  canBeResumed(): boolean {
    return this.estado === EstadoPlan.PAUSADO;
  }

  // Métodos de actualización (inmutables)
  complete(): PlanNutricional {
    if (!this.canBeCompleted()) {
      throw new Error('No se puede completar el plan en su estado actual');
    }
    
    return new PlanNutricional({
      ...this._attributes,
      estado: EstadoPlan.COMPLETADO,
      fechaFin: new Date(),
      fechaActualizacion: new Date()
    });
  }

  pause(): PlanNutricional {
    if (!this.canBePaused()) {
      throw new Error('No se puede pausar el plan en su estado actual');
    }
    
    return new PlanNutricional({
      ...this._attributes,
      estado: EstadoPlan.PAUSADO,
      fechaActualizacion: new Date()
    });
  }

  resume(): PlanNutricional {
    if (!this.canBeResumed()) {
      throw new Error('No se puede reanudar el plan en su estado actual');
    }
    
    return new PlanNutricional({
      ...this._attributes,
      estado: EstadoPlan.ACTIVO,
      fechaActualizacion: new Date()
    });
  }

  cancel(): PlanNutricional {
    return new PlanNutricional({
      ...this._attributes,
      estado: EstadoPlan.CANCELADO,
      fechaFin: new Date(),
      fechaActualizacion: new Date()
    });
  }

  updateGoals(goals: {
    caloriasObjetivo?: number;
    proteinaObjetivo?: number;
    carbohidratosObjetivo?: number;
    grasasObjetivo?: number;
  }): PlanNutricional {
    if (!this.canBeModified()) {
      throw new Error('No se pueden actualizar las metas en el estado actual del plan');
    }

    return new PlanNutricional({
      ...this._attributes,
      ...goals,
      fechaActualizacion: new Date()
    });
  }

  // Para obtener primitivos (útil para persistencia)
  toPrimitives(): PrimitivePlanNutricional {
    return { ...this._attributes };
  }
}