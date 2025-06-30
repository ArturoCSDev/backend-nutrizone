export enum EstadoConversacion {
    ACTIVA='ACTIVA',
    COMPLETADA='COMPLETADA',
    ABANDONADA='ABANDONADA' 
  }
  
  export interface PrimitiveConversacionChat {
    id: string;
    clienteId: string;
    planId: string | null;
  
    objetivo: string | null;
    contexto: Record<string, any> | null;
    estado: EstadoConversacion;
  
    fechaInicio: Date;
    fechaFin: Date | null;
  
    fechaCreacion: Date;
    fechaActualizacion: Date;
  }
  
  export class ConversacionChat {
    private constructor(private readonly _attributes: PrimitiveConversacionChat) {}
  
    static create(
      conversacion: Omit<PrimitiveConversacionChat, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaInicio' | 'estado'>
    ): ConversacionChat {
      const now = new Date();
      return new ConversacionChat({
        id: crypto.randomUUID(),
        ...conversacion,
        estado: EstadoConversacion.ACTIVA,
        fechaInicio: now,
        fechaFin: null,
        fechaCreacion: now,
        fechaActualizacion: now
      });
    }
  
    static fromPrimitives(primitives: PrimitiveConversacionChat): ConversacionChat {
      return new ConversacionChat(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get clienteId(): string {
      return this._attributes.clienteId;
    }
  
    get planId(): string | null {
      return this._attributes.planId;
    }
  
    get objetivo(): string | null {
      return this._attributes.objetivo;
    }
  
    get contexto(): Record<string, any> | null {
      return this._attributes.contexto;
    }
  
    get estado(): EstadoConversacion {
      return this._attributes.estado;
    }
  
    get fechaInicio(): Date {
      return this._attributes.fechaInicio;
    }
  
    get fechaFin(): Date | null {
      return this._attributes.fechaFin;
    }
  
    get fechaCreacion(): Date {
      return this._attributes.fechaCreacion;
    }
  
    get fechaActualizacion(): Date {
      return this._attributes.fechaActualizacion;
    }
  
    // Lógica de negocio
    finalizar(fecha: Date = new Date()): ConversacionChat {
      return new ConversacionChat({
        ...this._attributes,
        estado: EstadoConversacion.COMPLETADA,
        fechaFin: fecha,
        fechaActualizacion: new Date()
      });
    }
  
    cancelar(): ConversacionChat {
      return new ConversacionChat({
        ...this._attributes,
        estado: EstadoConversacion.ABANDONADA,
        fechaFin: new Date(),
        fechaActualizacion: new Date()
      });
    }
  
    actualizarObjetivo(obj: string | null): ConversacionChat {
      return new ConversacionChat({
        ...this._attributes,
        objetivo: obj,
        fechaActualizacion: new Date()
      });
    }
  
    actualizarContexto(ctx: Record<string, any>): ConversacionChat {
      return new ConversacionChat({
        ...this._attributes,
        contexto: ctx,
        fechaActualizacion: new Date()
      });
    }
  
    estaActiva(): boolean {
      return this.estado === EstadoConversacion.ACTIVA;
    }
  
    toPrimitives(): PrimitiveConversacionChat {
      return { ...this._attributes };
    }
  }
  