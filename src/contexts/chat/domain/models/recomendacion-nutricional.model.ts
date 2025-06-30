export enum RespuestaUsuario {
    ACEPTADA = 'ACEPTADA',
    RECHAZADA = 'RECHAZADA',
    MODIFICADA = 'MODIFICADA',
    PENDIENTE = 'PENDIENTE'
  }
  
  export enum Prioridad {
    ALTA = 'ALTA',
    MEDIA = 'MEDIA',
    BAJA = 'BAJA'
  }
  
  export interface PrimitiveRecomendacionNutricional {
    id: string;
    mensajeId: string;
    productoId: string;
    tamanoId: string | null;
  
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
      data: Omit<PrimitiveRecomendacionNutricional, 'id' | 'fechaCreacion' | 'fechaRespuesta' | 'respuestaUsuario'>
    ): RecomendacionNutricional {
      const now = new Date();
      return new RecomendacionNutricional({
        id: crypto.randomUUID(),
        ...data,
        respuestaUsuario: RespuestaUsuario.PENDIENTE,
        fechaCreacion: now,
        fechaRespuesta: null
      });
    }
  
    static fromPrimitives(primitives: PrimitiveRecomendacionNutricional): RecomendacionNutricional {
      return new RecomendacionNutricional(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get mensajeId(): string {
      return this._attributes.mensajeId;
    }
  
    get productoId(): string {
      return this._attributes.productoId;
    }
  
    get tamanoId(): string | null {
      return this._attributes.tamanoId;
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
  
    // Lógica de negocio
    aceptar(): RecomendacionNutricional {
      return new RecomendacionNutricional({
        ...this._attributes,
        respuestaUsuario: RespuestaUsuario.ACEPTADA,
        fechaRespuesta: new Date()
      });
    }
  
    rechazar(): RecomendacionNutricional {
      return new RecomendacionNutricional({
        ...this._attributes,
        respuestaUsuario: RespuestaUsuario.RECHAZADA,
        fechaRespuesta: new Date()
      });
    }
  
    modificarTiming(nuevoTiming: string): RecomendacionNutricional {
      return new RecomendacionNutricional({
        ...this._attributes,
        respuestaUsuario: RespuestaUsuario.MODIFICADA,
        timingModificado: nuevoTiming,
        fechaRespuesta: new Date()
      });
    }
  
    esPendiente(): boolean {
      return this._attributes.respuestaUsuario === RespuestaUsuario.PENDIENTE;
    }
  
    esAceptada(): boolean {
      return this._attributes.respuestaUsuario === RespuestaUsuario.ACEPTADA;
    }
  
    toPrimitives(): PrimitiveRecomendacionNutricional {
      return { ...this._attributes };
    }
  }
  