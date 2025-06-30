// enums.ts (si lo deseas en archivo aparte)
export enum ObjetivoNutricional {
    PERDIDA_PESO='PERDIDA_PESO',
    GANANCIA_MUSCULAR='GANANCIA_MUSCULAR',
    MANTENIMIENTO='MANTENIMIENTO',
    DEFINICION='DEFINICION',
    VOLUMEN='VOLUMEN',
    RECUPERACION='RECUPERACION'
  }
  
  export enum EstadoPlan {
    ACTIVO = 'ACTIVO',
    COMPLETADO = 'COMPLETADO',
    PAUSADO = 'PAUSADO',
    CANCELADO = 'CANCELADO'
  }
  
  // plan-nutricional.model.ts
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

  // Getters
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

  // Métodos de negocio
  isActivo(): boolean {
    return this.estado === EstadoPlan.ACTIVO;
  }

  isFinalizado(): boolean {
    return this.estado === EstadoPlan.COMPLETADO;
  }

  isPausado(): boolean {
    return this.estado === EstadoPlan.PAUSADO;
  }

  isCancelado(): boolean {
    return this.estado === EstadoPlan.CANCELADO;
  }

  updateDescripcion(nuevaDescripcion: string | null): PlanNutricional {
    return new PlanNutricional({
      ...this._attributes,
      descripcion: nuevaDescripcion,
      fechaActualizacion: new Date()
    });
  }

  updateEstado(nuevoEstado: EstadoPlan): PlanNutricional {
    return new PlanNutricional({
      ...this._attributes,
      estado: nuevoEstado,
      fechaActualizacion: new Date()
    });
  }

  updateFechaFin(nuevaFechaFin: Date): PlanNutricional {
    return new PlanNutricional({
      ...this._attributes,
      fechaFin: nuevaFechaFin,
      fechaActualizacion: new Date()
    });
  }

  toPrimitives(): PrimitivePlanNutricional {
    return { ...this._attributes };
  }
}
