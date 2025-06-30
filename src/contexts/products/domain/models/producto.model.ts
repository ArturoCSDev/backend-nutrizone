export enum MomentoDelDia {
  MANANA = 'MANANA',
  PRE_ENTRENAMIENTO = 'PRE_ENTRENAMIENTO',
  POST_ENTRENAMIENTO = 'POST_ENTRENAMIENTO',
  TARDE = 'TARDE',
  NOCHE = 'NOCHE',
  ANTES_DORMIR = 'ANTES_DORMIR'
}

export interface PrimitiveProducto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  // Información nutricional
  proteina: number | null;
  calorias: number | null;
  volumen: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  fibra: number | null;
  azucar: number | null;
  // Relaciones FK
  categoriaId: string | null;
  saborId: string | null;
  tamanoId: string | null;
  // Información adicional
  urlImagen: string | null;
  ingredientes: string[];
  etiquetas: string[];
  momentosRecomendados: MomentoDelDia[];
  // Timestamps
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export class Producto {
  private constructor(private readonly _attributes: PrimitiveProducto) {}

  static create(
    createProducto: Omit<PrimitiveProducto, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Producto {
    const now = new Date();
    return new Producto({
      id: crypto.randomUUID(),
      ...createProducto,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
  }

  static fromPrimitives(primitives: PrimitiveProducto): Producto {
    return new Producto(primitives);
  }

  // Getters básicos
  get id(): string {
    return this._attributes.id;
  }

  get nombre(): string {
    return this._attributes.nombre;
  }

  get descripcion(): string | null {
    return this._attributes.descripcion;
  }

  get precio(): number {
    return this._attributes.precio;
  }

  get proteina(): number | null {
    return this._attributes.proteina;
  }

  get calorias(): number | null {
    return this._attributes.calorias;
  }

  get volumen(): number | null {
    return this._attributes.volumen;
  }

  get carbohidratos(): number | null {
    return this._attributes.carbohidratos;
  }

  get grasas(): number | null {
    return this._attributes.grasas;
  }

  get fibra(): number | null {
    return this._attributes.fibra;
  }

  get azucar(): number | null {
    return this._attributes.azucar;
  }

  get categoriaId(): string | null {
    return this._attributes.categoriaId;
  }

  get saborId(): string | null {
    return this._attributes.saborId;
  }

  get tamanoId(): string | null {
    return this._attributes.tamanoId;
  }

  get urlImagen(): string | null {
    return this._attributes.urlImagen;
  }

  get ingredientes(): string[] {
    return [...this._attributes.ingredientes];
  }

  get etiquetas(): string[] {
    return [...this._attributes.etiquetas];
  }

  get momentosRecomendados(): MomentoDelDia[] {
    return [...this._attributes.momentosRecomendados];
  }

  get fechaCreacion(): Date {
    return this._attributes.fechaCreacion;
  }

  get fechaActualizacion(): Date {
    return this._attributes.fechaActualizacion;
  }

  // Métodos de negocio
  hasDescripcion(): boolean {
    return this.descripcion !== null && this.descripcion.trim().length > 0;
  }

  hasImagen(): boolean {
    return this.urlImagen !== null && this.urlImagen.trim().length > 0;
  }

  hasIngredientes(): boolean {
    return this.ingredientes.length > 0;
  }

  hasEtiquetas(): boolean {
    return this.etiquetas.length > 0;
  }

  hasMomentosRecomendados(): boolean {
    return this.momentosRecomendados.length > 0;
  }

  hasInfoNutricional(): boolean {
    return this.proteina !== null || this.calorias !== null || 
           this.carbohidratos !== null || this.grasas !== null;
  }

  isCompleteProduct(): boolean {
    return this.categoriaId !== null && this.saborId !== null && this.tamanoId !== null;
  }

  getPrecioFormateado(): string {
    return `S/. ${this.precio.toFixed(2)}`;
  }

  // Métodos de actualización
  updateNombre(nuevoNombre: string): Producto {
    if (!nuevoNombre || nuevoNombre.trim().length === 0) {
      throw new Error('El nombre del producto no puede estar vacío');
    }

    return new Producto({
      ...this._attributes,
      nombre: nuevoNombre.trim(),
      fechaActualizacion: new Date()
    });
  }

  updateDescripcion(nuevaDescripcion: string | null): Producto {
    return new Producto({
      ...this._attributes,
      descripcion: nuevaDescripcion?.trim() || null,
      fechaActualizacion: new Date()
    });
  }

  updatePrecio(nuevoPrecio: number): Producto {
    if (nuevoPrecio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    return new Producto({
      ...this._attributes,
      precio: nuevoPrecio,
      fechaActualizacion: new Date()
    });
  }

  updateInfoNutricional(infoNutricional: {
    proteina?: number | null;
    calorias?: number | null;
    volumen?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
    fibra?: number | null;
    azucar?: number | null;
  }): Producto {
    return new Producto({
      ...this._attributes,
      ...infoNutricional,
      fechaActualizacion: new Date()
    });
  }

  updateRelaciones(relaciones: {
    categoriaId?: string | null;
    saborId?: string | null;
    tamanoId?: string | null;
  }): Producto {
    return new Producto({
      ...this._attributes,
      ...relaciones,
      fechaActualizacion: new Date()
    });
  }

  updateIngredientes(nuevosIngredientes: string[]): Producto {
    return new Producto({
      ...this._attributes,
      ingredientes: [...nuevosIngredientes],
      fechaActualizacion: new Date()
    });
  }

  updateEtiquetas(nuevasEtiquetas: string[]): Producto {
    return new Producto({
      ...this._attributes,
      etiquetas: [...nuevasEtiquetas],
      fechaActualizacion: new Date()
    });
  }

  updateMomentosRecomendados(nuevosMomentos: MomentoDelDia[]): Producto {
    return new Producto({
      ...this._attributes,
      momentosRecomendados: [...nuevosMomentos],
      fechaActualizacion: new Date()
    });
  }

  updateUrlImagen(nuevaUrl: string | null): Producto {
    return new Producto({
      ...this._attributes,
      urlImagen: nuevaUrl?.trim() || null,
      fechaActualizacion: new Date()
    });
  }

  compareByNombre(otroProducto: Producto): number {
    return this.nombre.localeCompare(otroProducto.nombre);
  }

  compareByPrecio(otroProducto: Producto): number {
    return this.precio - otroProducto.precio;
  }

  toPrimitives(): PrimitiveProducto {
    return { ...this._attributes };
  }
}