import { ObjetivoNutricional, DiaSemana } from '@prisma/client';

export interface PrimitivePreferenciaCliente {
  id: string;
  clienteId: string;
  productosFavoritos: string[];
  preferenciasDieteticas: string[];
  alergenos: string[];
  objetivosFitness: ObjetivoNutricional[];
  diasEntrenamiento: DiaSemana[];
  horariosEntrenamiento: string[];
  horaDespertar: Date | null;
  horaDormir: Date | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class PreferenciaCliente {
  private constructor(private readonly _attributes: PrimitivePreferenciaCliente) {}

  static create(
    createPreferencia: Omit<PrimitivePreferenciaCliente, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): PreferenciaCliente {
    const now = new Date();

    return new PreferenciaCliente({
      id: crypto.randomUUID(),
      ...createPreferencia,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitivePreferenciaCliente): PreferenciaCliente {
    return new PreferenciaCliente(primitives);
  }

  // Getters
  get id(): string {
    return this._attributes.id;
  }

  get clienteId(): string {
    return this._attributes.clienteId;
  }

  get productosFavoritos(): string[] {
    return this._attributes.productosFavoritos;
  }

  get preferenciasDieteticas(): string[] {
    return this._attributes.preferenciasDieteticas;
  }

  get alergenos(): string[] {
    return this._attributes.alergenos;
  }

  get objetivosFitness(): ObjetivoNutricional[] {
    return this._attributes.objetivosFitness;
  }

  get diasEntrenamiento(): DiaSemana[] {
    return this._attributes.diasEntrenamiento;
  }

  get horariosEntrenamiento(): string[] {
    return this._attributes.horariosEntrenamiento;
  }

  get horaDespertar(): Date | null {
    return this._attributes.horaDespertar;
  }

  get horaDormir(): Date | null {
    return this._attributes.horaDormir;
  }

  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }

  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }

  // Métodos de negocio
  hasAllergies(): boolean {
    return this.alergenos.length > 0;
  }

  isAllergenFree(productIngredients: string[]): boolean {
    return !this.alergenos.some(allergen => 
      productIngredients.some(ingredient => 
        ingredient.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  }

  trainsOnDay(day: DiaSemana): boolean {
    return this.diasEntrenamiento.includes(day);
  }

  hasTrainingSchedule(): boolean {
    return this.diasEntrenamiento.length > 0 && this.horariosEntrenamiento.length > 0;
  }

  hasGoal(objetivo: ObjetivoNutricional): boolean {
    return this.objetivosFitness.includes(objetivo);
  }

  hasCompleteSchedule(): boolean {
    return !!(this.horaDespertar && this.horaDormir);
  }

  // Métodos de actualización
  addFavoriteProduct(productId: string): PreferenciaCliente {
    if (this.productosFavoritos.includes(productId)) return this;
    
    return new PreferenciaCliente({
      ...this._attributes,
      productosFavoritos: [...this.productosFavoritos, productId],
      fechaActualizacion: new Date()
    });
  }

  removeFavoriteProduct(productId: string): PreferenciaCliente {
    return new PreferenciaCliente({
      ...this._attributes,
      productosFavoritos: this.productosFavoritos.filter(id => id !== productId),
      fechaActualizacion: new Date()
    });
  }

  updateTrainingDays(days: DiaSemana[]): PreferenciaCliente {
    return new PreferenciaCliente({
      ...this._attributes,
      diasEntrenamiento: days,
      fechaActualizacion: new Date()
    });
  }

  updateGoals(objetivos: ObjetivoNutricional[]): PreferenciaCliente {
    return new PreferenciaCliente({
      ...this._attributes,
      objetivosFitness: objetivos,
      fechaActualizacion: new Date()
    });
  }

  toPrimitives(): PrimitivePreferenciaCliente {
    return { ...this._attributes };
  }
}
