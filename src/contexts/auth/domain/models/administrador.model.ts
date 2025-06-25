export interface PrimitiveAdministrador {
    id: string;
    usuarioId: string;
    departamento: string | null;
    nivelAcceso: number;
    ultimoAcceso: Date | null;
    fechaCreacion: Date;
    fechaActualizacion: Date;
  }
  
export class Administrador {
  private constructor(private readonly _attributes: PrimitiveAdministrador) {}
  
  static create(
    createAdministrador: Omit<PrimitiveAdministrador, 'id' | 'nivelAcceso' | 'ultimoAcceso' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Administrador {
    const now = new Date();
    return new Administrador({
      id: crypto.randomUUID(),
      ...createAdministrador,
      nivelAcceso: 1,
      ultimoAcceso: null,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }
  
  static fromPrimitives(primitives: PrimitiveAdministrador): Administrador {
    return new Administrador(primitives);
  }
  
  // Getters
  get id(): string {
    return this._attributes.id;
  }
  
  get usuarioId(): string {
    return this._attributes.usuarioId;
  }
  
  get departamento(): string | null {
    return this._attributes.departamento;
  }
  
  get nivelAcceso(): number {
    return this._attributes.nivelAcceso;
  }
  
  get ultimoAcceso(): Date | null {
    return this._attributes.ultimoAcceso;
  }
  
  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }
  
  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }
  
  // Métodos de negocio
  hasHighAccess(): boolean {
    return this.nivelAcceso >= 3;
  }
  
  hasMediumAccess(): boolean {
    return this.nivelAcceso >= 2;
  }
  
  hasBasicAccess(): boolean {
    return this.nivelAcceso >= 1;
  }
  
  updateLastAccess(): Administrador {
    return new Administrador({
      ...this._attributes,
      ultimoAcceso: new Date(),
      fechaActualizacion: new Date()
    });
  }
  
  changeAccessLevel(newLevel: number): Administrador {
    return new Administrador({
      ...this._attributes,
      nivelAcceso: newLevel,
      fechaActualizacion: new Date()
    });
  }
  
  changeDepartment(department: string): Administrador {
    return new Administrador({
      ...this._attributes,
      departamento: department,
      fechaActualizacion: new Date()
    });
  }
  
  toPrimitives(): PrimitiveAdministrador {
    return { ...this._attributes };
  }
}
