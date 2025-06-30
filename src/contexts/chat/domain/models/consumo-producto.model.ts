export enum MomentoDelDia {
    MANANA = 'MANANA',
    PRE_ENTRENAMIENTO = 'PRE_ENTRENAMIENTO',
    POST_ENTRENAMIENTO = 'POST_ENTRENAMIENTO',
    TARDE = 'TARDE',
    NOCHE = 'NOCHE',
    ANTES_DORMIR = 'ANTES_DORMIR'
  }
  
  export interface PrimitiveConsumoProducto {
    id: string;
    clienteId: string;
    productoId: string;
    planId: string | null;
  
    fechaConsumo: Date;
    cantidad: number;
    tamano: string | null;
  
    momentoConsumo: MomentoDelDia | null;
    notas: string | null;
  
    recomendacionId: string | null;
    fueRecomendado: boolean;
  
    fechaCreacion: Date;
  }
  
  export class ConsumoProducto {
    private constructor(private readonly _attributes: PrimitiveConsumoProducto) {}
  
    static create(
      consumo: Omit<PrimitiveConsumoProducto, 'id' | 'fechaCreacion' | 'fueRecomendado'>
    ): ConsumoProducto {
      return new ConsumoProducto({
        id: crypto.randomUUID(),
        ...consumo,
        fueRecomendado: !!consumo.recomendacionId,
        fechaCreacion: new Date()
      });
    }
  
    static fromPrimitives(primitives: PrimitiveConsumoProducto): ConsumoProducto {
      return new ConsumoProducto(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get clienteId(): string {
      return this._attributes.clienteId;
    }
  
    get productoId(): string {
      return this._attributes.productoId;
    }
  
    get planId(): string | null {
      return this._attributes.planId;
    }
  
    get fechaConsumo(): Date {
      return this._attributes.fechaConsumo;
    }
  
    get cantidad(): number {
      return this._attributes.cantidad;
    }
  
    get tamano(): string | null {
      return this._attributes.tamano;
    }
  
    get momentoConsumo(): MomentoDelDia | null {
      return this._attributes.momentoConsumo;
    }
  
    get notas(): string | null {
      return this._attributes.notas;
    }
  
    get recomendacionId(): string | null {
      return this._attributes.recomendacionId;
    }
  
    get fueRecomendado(): boolean {
      return this._attributes.fueRecomendado;
    }
  
    get fechaCreacion(): Date {
      return this._attributes.fechaCreacion;
    }
  
    // Lógica de negocio
    esPorRecomendacion(): boolean {
      return this._attributes.fueRecomendado && this._attributes.recomendacionId !== null;
    }
  
    actualizarNotas(nuevasNotas: string | null): ConsumoProducto {
      return new ConsumoProducto({
        ...this._attributes,
        notas: nuevasNotas
      });
    }
  
    actualizarMomento(nuevoMomento: MomentoDelDia): ConsumoProducto {
      return new ConsumoProducto({
        ...this._attributes,
        momentoConsumo: nuevoMomento
      });
    }
  
    toPrimitives(): PrimitiveConsumoProducto {
      return { ...this._attributes };
    }
  }
  