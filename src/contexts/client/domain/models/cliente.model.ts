import { NivelActividad } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface PrimitiveCliente {
  id: string;
  usuarioId: string;
  edad: number | null;
  peso: Decimal | null;
  altura: Decimal | null;
  nivelActividad: NivelActividad | null;
  telefono: string | null;
  fechaNacimiento: Date | null;
  genero: string | null;
  grasaCorporal: Decimal | null;
  masaMuscular: Decimal | null;
  metabolismoBasal: number | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class Cliente {
  private constructor(private readonly _attributes: PrimitiveCliente) {}

  static create(
    createCliente: Omit<PrimitiveCliente, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Cliente {
    const now = new Date();

    return new Cliente({
      id: crypto.randomUUID(),
      ...createCliente,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitiveCliente): Cliente {
    return new Cliente(primitives);
  }

  // Getters básicos
  get id(): string {
    return this._attributes.id;
  }

  get usuarioId(): string {
    return this._attributes.usuarioId;
  }

  get edad(): number | null {
    return this._attributes.edad;
  }

  get peso(): Decimal | null {
    return this._attributes.peso;
  }

  get altura(): Decimal | null {
    return this._attributes.altura;
  }

  get nivelActividad(): NivelActividad | null {
    return this._attributes.nivelActividad;
  }

  get telefono(): string | null {
    return this._attributes.telefono;
  }

  get fechaNacimiento(): Date | null {
    return this._attributes.fechaNacimiento;
  }

  get genero(): string | null {
    return this._attributes.genero;
  }

  get grasaCorporal(): Decimal | null {
    return this._attributes.grasaCorporal;
  }

  get masaMuscular(): Decimal | null {
    return this._attributes.masaMuscular;
  }

  get metabolismoBasal(): number | null {
    return this._attributes.metabolismoBasal;
  }

  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }

  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }

  // Getters calculados
  get imc(): number | null {
    if (!this.peso || !this.altura) return null;
    const pesoNum = Number(this.peso);
    const alturaMetros = Number(this.altura) / 100; // Asumiendo altura en cm
    return pesoNum / (alturaMetros * alturaMetros);
  }

  get edadCalculada(): number | null {
    if (!this.fechaNacimiento) return null;
    const today = new Date();
    const birthDate = new Date(this.fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Métodos de negocio
  hasCompleteProfile(): boolean {
    return !!(this.edad && this.peso && this.altura && this.nivelActividad && this.genero);
  }

  hasBodyComposition(): boolean {
    return !!(this.grasaCorporal && this.masaMuscular);
  }

  isUnderweight(): boolean {
    const imc = this.imc;
    return imc ? imc < 18.5 : false;
  }

  isNormalWeight(): boolean {
    const imc = this.imc;
    return imc ? imc >= 18.5 && imc < 25 : false;
  }

  isOverweight(): boolean {
    const imc = this.imc;
    return imc ? imc >= 25 && imc < 30 : false;
  }

  isObese(): boolean {
    const imc = this.imc;
    return imc ? imc >= 30 : false;
  }

  // Métodos de actualización
  updatePhysicalData(data: {
    peso?: Decimal;
    altura?: Decimal;
    grasaCorporal?: Decimal;
    masaMuscular?: Decimal;
  }): Cliente {
    return new Cliente({
      ...this._attributes,
      ...data,
      fechaActualizacion: new Date()
    });
  }

  updateContactInfo(telefono: string): Cliente {
    return new Cliente({
      ...this._attributes,
      telefono,
      fechaActualizacion: new Date()
    });
  }

  updateActivityLevel(nivelActividad: NivelActividad): Cliente {
    return new Cliente({
      ...this._attributes,
      nivelActividad,
      fechaActualizacion: new Date()
    });
  }

  toPrimitives(): PrimitiveCliente {
    return { ...this._attributes };
  }
}
