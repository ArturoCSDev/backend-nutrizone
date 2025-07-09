import { Prioridad, RespuestaUsuario } from '@prisma/client';

export interface PrimitiveRecomendacionNutricional {
  id: string;
  mensajeId: string | null;
  productoId: string;
  tamanoId: string | null;
  planId: string | null;
  tituloRecomendacion: string | null;
  iconoProducto: string | null;
  timingRecomendado: string;
  horarioEspecifico: Date | null;
  timingAdicional: string | null;
  prioridad: Prioridad;
  razonamiento: string;
  dosis: string | null;
  frecuencia: string | null;
  respuestaUsuario: RespuestaUsuario;
  timingModificado: string | null;
  fechaCreacion: Date;
  fechaRespuesta: Date | null;
}

export class RecomendacionNutricional {
  private constructor(private readonly _attributes: PrimitiveRecomendacionNutricional) {}

  static create(
    createRecomendacion: Omit<PrimitiveRecomendacionNutricional, 'id' | 'fechaCreacion' | 'fechaRespuesta'>
  ): RecomendacionNutricional {
    return new RecomendacionNutricional({
      id: crypto.randomUUID(),
      ...createRecomendacion,
      fechaCreacion: new Date(),
      fechaRespuesta: null,
    });
  }

  static fromPrimitives(primitives: PrimitiveRecomendacionNutricional): RecomendacionNutricional {
    return new RecomendacionNutricional(primitives);
  }

  // Getters básicos
  get id(): string { 
    return this._attributes.id; 
  }

  get mensajeId(): string | null { 
    return this._attributes.mensajeId; 
  }

  get productoId(): string { 
    return this._attributes.productoId; 
  }

  get tamanoId(): string | null { 
    return this._attributes.tamanoId; 
  }

  get planId(): string | null { 
    return this._attributes.planId; 
  }

  get tituloRecomendacion(): string | null { 
    return this._attributes.tituloRecomendacion; 
  }

  get iconoProducto(): string | null { 
    return this._attributes.iconoProducto; 
  }

  get timingRecomendado(): string { 
    return this._attributes.timingRecomendado; 
  }

  get horarioEspecifico(): Date | null { 
    return this._attributes.horarioEspecifico; 
  }

  get timingAdicional(): string | null { 
    return this._attributes.timingAdicional; 
  }

  get prioridad(): Prioridad { 
    return this._attributes.prioridad; 
  }

  get razonamiento(): string { 
    return this._attributes.razonamiento; 
  }

  get dosis(): string | null { 
    return this._attributes.dosis; 
  }

  get frecuencia(): string | null { 
    return this._attributes.frecuencia; 
  }

  get respuestaUsuario(): RespuestaUsuario { 
    return this._attributes.respuestaUsuario; 
  }

  get timingModificado(): string | null { 
    return this._attributes.timingModificado; 
  }

  get fechaCreacion(): Date { 
    return this._attributes.fechaCreacion; 
  }

  get fechaRespuesta(): Date | null { 
    return this._attributes.fechaRespuesta; 
  }

  // Getters compuestos
  get isPending(): boolean {
    return this.respuestaUsuario === RespuestaUsuario.PENDIENTE;
  }

  get isAccepted(): boolean {
    return this.respuestaUsuario === RespuestaUsuario.ACEPTADA;
  }

  get isRejected(): boolean {
    return this.respuestaUsuario === RespuestaUsuario.RECHAZADA;
  }

  get isModified(): boolean {
    return this.respuestaUsuario === RespuestaUsuario.MODIFICADA;
  }

  get hasHighPriority(): boolean {
    return this.prioridad === Prioridad.ALTA;
  }

  get hasMediumPriority(): boolean {
    return this.prioridad === Prioridad.MEDIA;
  }

  get hasLowPriority(): boolean {
    return this.prioridad === Prioridad.BAJA;
  }

  get isForChat(): boolean {
    return this.mensajeId !== null;
  }

  get isForPlan(): boolean {
    return this.planId !== null;
  }

  // Métodos de negocio
  canBeAccepted(): boolean {
    return this.isPending;
  }

  canBeRejected(): boolean {
    return this.isPending;
  }

  canBeModified(): boolean {
    return this.isPending || this.isAccepted;
  }

  hasExpired(): boolean {
    // Consideramos que una recomendación expira después de 7 días sin respuesta
    if (!this.isPending) return false;
    
    const now = new Date();
    const creationTime = this.fechaCreacion.getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    return (now.getTime() - creationTime) > sevenDaysInMs;
  }

  // Métodos de actualización (inmutables)
  accept(): RecomendacionNutricional {
    if (!this.canBeAccepted()) {
      throw new Error('No se puede aceptar la recomendación en su estado actual');
    }

    return new RecomendacionNutricional({
      ...this._attributes,
      respuestaUsuario: RespuestaUsuario.ACEPTADA,
      fechaRespuesta: new Date()
    });
  }

  reject(): RecomendacionNutricional {
    if (!this.canBeRejected()) {
      throw new Error('No se puede rechazar la recomendación en su estado actual');
    }

    return new RecomendacionNutricional({
      ...this._attributes,
      respuestaUsuario: RespuestaUsuario.RECHAZADA,
      fechaRespuesta: new Date()
    });
  }

  modify(newTiming: string): RecomendacionNutricional {
    if (!this.canBeModified()) {
      throw new Error('No se puede modificar la recomendación en su estado actual');
    }

    return new RecomendacionNutricional({
      ...this._attributes,
      respuestaUsuario: RespuestaUsuario.MODIFICADA,
      timingModificado: newTiming,
      fechaRespuesta: new Date()
    });
  }

  updatePriority(newPriority: Prioridad): RecomendacionNutricional {
    return new RecomendacionNutricional({
      ...this._attributes,
      prioridad: newPriority
    });
  }

  // Para obtener primitivos (útil para persistencia)
  toPrimitives(): PrimitiveRecomendacionNutricional {
    return { ...this._attributes };
  }
}