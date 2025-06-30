export enum TipoProducto {
    BATIDO = 'BATIDO',
    REFRESCO = 'REFRESCO',
    WAFFLE = 'WAFFLE'
  }
  
  export interface PrimitiveCategoria {
    id: string;
    nombre: string;
    descripcion: string | null;
    tipoProducto: TipoProducto;
    fechaCreacion: Date;
    fechaActualizacion: Date;
  }
  
  export class Categoria {
    private constructor(private readonly _attributes: PrimitiveCategoria) {}
  
    static create(
      createCategoria: Omit<PrimitiveCategoria, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
    ): Categoria {
      const now = new Date();
      return new Categoria({
        id: crypto.randomUUID(),
        ...createCategoria,
        fechaCreacion: now,
        fechaActualizacion: now,
      });
    }
  
    static fromPrimitives(primitives: PrimitiveCategoria): Categoria {
      return new Categoria(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get nombre(): string {
      return this._attributes.nombre;
    }
  
    get descripcion(): string | null {
      return this._attributes.descripcion;
    }
  
    get tipoProducto(): TipoProducto {
      return this._attributes.tipoProducto;
    }
  
    get fechaCreacion(): Date {
      return this._attributes.fechaCreacion;
    }
  
    get fechaActualizacion(): Date {
      return this._attributes.fechaActualizacion;
    }
  
    // Métodos de negocio
    isBatido(): boolean {
      return this.tipoProducto === TipoProducto.BATIDO;
    }
  
    isRefresco(): boolean {
      return this.tipoProducto === TipoProducto.REFRESCO;
    }
  
    isWaffle(): boolean {
      return this.tipoProducto === TipoProducto.WAFFLE;
    }
  
    updateNombre(nuevoNombre: string): Categoria {
      return new Categoria({
        ...this._attributes,
        nombre: nuevoNombre,
        fechaActualizacion: new Date()
      });
    }
  
    updateDescripcion(nuevaDescripcion: string | null): Categoria {
      return new Categoria({
        ...this._attributes,
        descripcion: nuevaDescripcion,
        fechaActualizacion: new Date()
      });
    }
  
    changeTipoProducto(nuevoTipo: TipoProducto): Categoria {
      return new Categoria({
        ...this._attributes,
        tipoProducto: nuevoTipo,
        fechaActualizacion: new Date()
      });
    }
  
    hasDescripcion(): boolean {
      return this.descripcion !== null && this.descripcion.trim().length > 0;
    }
  
    toPrimitives(): PrimitiveCategoria {
      return { ...this._attributes };
    }
  }