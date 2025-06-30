export interface PrimitiveTamano {
    id: string;
    nombre: string;
    volumen: number; // en ml
    proteina: number; // en gramos
    fechaCreacion: Date;
    fechaActualizacion: Date;
  }
  
  export class Tamano {
    private constructor(private readonly _attributes: PrimitiveTamano) {}
  
    static create(
      createTamano: Omit<PrimitiveTamano, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
    ): Tamano {
      const now = new Date();
      return new Tamano({
        id: crypto.randomUUID(),
        ...createTamano,
        fechaCreacion: now,
        fechaActualizacion: now,
      });
    }
  
    static fromPrimitives(primitives: PrimitiveTamano): Tamano {
      return new Tamano(primitives);
    }
  
    // Getters
    get id(): string {
      return this._attributes.id;
    }
  
    get nombre(): string {
      return this._attributes.nombre;
    }
  
    get volumen(): number {
      return this._attributes.volumen;
    }
  
    get proteina(): number {
      return this._attributes.proteina;
    }
  
    get fechaCreacion(): Date {
      return this._attributes.fechaCreacion;
    }
  
    get fechaActualizacion(): Date {
      return this._attributes.fechaActualizacion;
    }
  
    // Métodos de negocio
    getVolumenEnLitros(): number {
      return this.volumen / 1000;
    }
  
    getProteinaPorMl(): number {
      return this.volumen > 0 ? this.proteina / this.volumen : 0;
    }
  
    isPequeno(): boolean {
      return this.volumen <= 250;
    }
  
    isMediano(): boolean {
      return this.volumen > 250 && this.volumen <= 500;
    }
  
    isGrande(): boolean {
      return this.volumen > 500;
    }
  
    isAltaProteina(): boolean {
      return this.proteina >= 25;
    }
  
    updateNombre(nuevoNombre: string): Tamano {
      return new Tamano({
        ...this._attributes,
        nombre: nuevoNombre,
        fechaActualizacion: new Date()
      });
    }
  
    updateVolumen(nuevoVolumen: number): Tamano {
      return new Tamano({
        ...this._attributes,
        volumen: nuevoVolumen,
        fechaActualizacion: new Date()
      });
    }
  
    updateProteina(nuevaProteina: number): Tamano {
      return new Tamano({
        ...this._attributes,
        proteina: nuevaProteina,
        fechaActualizacion: new Date()
      });
    }
  
    comparePorVolumen(otroTamano: Tamano): number {
      return this.volumen - otroTamano.volumen;
    }
  
    comparePorProteina(otroTamano: Tamano): number {
      return this.proteina - otroTamano.proteina;
    }
  
    toPrimitives(): PrimitiveTamano {
      return { ...this._attributes };
    }
  }