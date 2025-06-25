import { RolUsuario } from '@prisma/client';

export interface PrimitiveUsuario {
  id: string;
  email: string;
  dni: string;
  password: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  rol: RolUsuario;
  active: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class Usuario {
  private constructor(private readonly _attributes: PrimitiveUsuario) {}

  static create(
    createUsuario: Omit<PrimitiveUsuario, 'id' | 'active' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Usuario {
    const now = new Date();

    return new Usuario({
      id: crypto.randomUUID(),
      ...createUsuario,
      active: true,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitiveUsuario): Usuario {
    return new Usuario(primitives);
  }

  // Getters básicos
  get id(): string {
    return this._attributes.id;
  }

  get email(): string {
    return this._attributes.email;
  }

  get dni(): string {
    return this._attributes.dni;
  }

  get password(): string {
    return this._attributes.password;
  }

  get nombre(): string {
    return this._attributes.nombre;
  }

  get apellidoPaterno(): string {
    return this._attributes.apellidoPaterno;
  }

  get apellidoMaterno(): string {
    return this._attributes.apellidoMaterno;
  }

  get rol(): RolUsuario {
    return this._attributes.rol;
  }

  get active(): boolean {
    return this._attributes.active;
  }

  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }

  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }

  // Getters compuestos
  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellidoPaterno} ${this.apellidoMaterno}`.trim();
  }

  get nombreCorto(): string {
    return `${this.nombre} ${this.apellidoPaterno}`;
  }

  // Métodos de negocio
  isActive(): boolean {
    return this.active;
  }

  isAdmin(): boolean {
    return this.rol === RolUsuario.ADMINISTRADOR;
  }

  isClient(): boolean {
    return this.rol === RolUsuario.CLIENTE;
  }

  canLogin(): boolean {
    return this.isActive();
  }

  // Método para actualizar (inmutable)
  updatePassword(newPassword: string): Usuario {
    return new Usuario({
      ...this._attributes,
      password: newPassword,
      fechaActualizacion: new Date()
    });
  }

  deactivate(): Usuario {
    return new Usuario({
      ...this._attributes,
      active: false,
      fechaActualizacion: new Date()
    });
  }

  activate(): Usuario {
    return new Usuario({
      ...this._attributes,
      active: true,
      fechaActualizacion: new Date()
    });
  }

  // Para obtener primitivos (útil para persistencia)
  toPrimitives(): PrimitiveUsuario {
    return { ...this._attributes };
  }
}
