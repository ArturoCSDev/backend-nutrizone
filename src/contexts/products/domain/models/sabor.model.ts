export interface PrimitiveSabor {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class Sabor {
  private constructor(private readonly _attributes: PrimitiveSabor) {}

  static create(
    createSabor: Omit<PrimitiveSabor, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Sabor {
    const now = new Date();
    return new Sabor({
      id: crypto.randomUUID(),
      ...createSabor,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitiveSabor): Sabor {
    return new Sabor(primitives);
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

  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }

  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }

  // Métodos de negocio simples
  hasDescripcion(): boolean {
    return this.descripcion !== null && this.descripcion.trim().length > 0;
  }

  updateNombre(nuevoNombre: string): Sabor {
    if (!nuevoNombre || nuevoNombre.trim().length === 0) {
      throw new Error('El nombre del sabor no puede estar vacío');
    }

    return new Sabor({
      ...this._attributes,
      nombre: nuevoNombre.trim(),
      fechaActualizacion: new Date()
    });
  }

  updateDescripcion(nuevaDescripcion: string | null): Sabor {
    return new Sabor({
      ...this._attributes,
      descripcion: nuevaDescripcion?.trim() || null,
      fechaActualizacion: new Date()
    });
  }

  compareByNombre(otroSabor: Sabor): number {
    return this.nombre.localeCompare(otroSabor.nombre);
  }

  toPrimitives(): PrimitiveSabor {
    return { ...this._attributes };
  }
}