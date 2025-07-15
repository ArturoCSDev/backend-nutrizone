import { IsOptional, IsString, IsNumber, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MomentoDelDia } from '../../domain/models/producto.model';
import { TipoProducto } from '@prisma/client';

export class AdvancedProductSearchDto {
  // Búsqueda por texto
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  search?: string; // Busca en nombre, descripción, ingredientes

  // Filtros de categorización
  @IsOptional()
  @IsArray({ message: 'Las categorías deben ser un array' })
  @IsString({ each: true, message: 'Cada ID de categoría debe ser una cadena' })
  categoriaIds?: string[];

  @IsOptional()
  @IsArray({ message: 'Los sabores deben ser un array' })
  @IsString({ each: true, message: 'Cada ID de sabor debe ser una cadena' })
  saborIds?: string[];

  @IsOptional()
  @IsArray({ message: 'Los tamaños deben ser un array' })
  @IsString({ each: true, message: 'Cada ID de tamaño debe ser una cadena' })
  tamanoIds?: string[];

  @IsOptional()
  @IsEnum(TipoProducto, { 
    message: 'El tipo de producto debe ser uno de: BATIDO, REFRESCO, WAFFLE' 
  })
  @Transform(({ value }) => value?.toUpperCase())
  tipoProducto?: TipoProducto;

  // Filtros de precio
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio mínimo debe ser un número' })
  @Min(0, { message: 'El precio mínimo debe ser mayor o igual a 0' })
  precioMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio máximo debe ser un número' })
  @Min(0, { message: 'El precio máximo debe ser mayor o igual a 0' })
  precioMax?: number;

  // Filtros nutricionales
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La proteína mínima debe ser un número' })
  @Min(0, { message: 'La proteína mínima debe ser mayor o igual a 0' })
  proteinaMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Las calorías mínimas deben ser un número' })
  @Min(0, { message: 'Las calorías mínimas deben ser mayor o igual a 0' })
  caloriasMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Las calorías máximas deben ser un número' })
  @Min(0, { message: 'Las calorías máximas deben ser mayor o igual a 0' })
  caloriasMax?: number;

  // Filtros de momento del día
  @IsOptional()
  @IsArray({ message: 'Los momentos del día deben ser un array' })
  @IsEnum(MomentoDelDia, { 
    each: true,
    message: 'Cada momento debe ser uno de: MANANA, PRE_ENTRENAMIENTO, POST_ENTRENAMIENTO, TARDE, NOCHE, ANTES_DORMIR' 
  })
  @Transform(({ value }) => value?.map((item: string) => item.toUpperCase()) || [])
  momentosDelDia?: MomentoDelDia[];

  // Filtros de etiquetas e ingredientes
  @IsOptional()
  @IsArray({ message: 'Las etiquetas deben ser un array' })
  @IsString({ each: true, message: 'Cada etiqueta debe ser una cadena de texto' })
  etiquetas?: string[];

  @IsOptional()
  @IsArray({ message: 'Los ingredientes deben ser un array' })
  @IsString({ each: true, message: 'Cada ingrediente debe ser una cadena de texto' })
  ingredientes?: string[]; // Productos que CONTIENEN estos ingredientes

  @IsOptional()
  @IsArray({ message: 'Los alergenos deben ser un array' })
  @IsString({ each: true, message: 'Cada alergeno debe ser una cadena de texto' })
  excludeAlergenos?: string[]; // Productos que NO contienen estos ingredientes

  // Filtros de estado/características
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  soloConImagen?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  soloCompletos?: boolean; // Solo productos con categoría, sabor y tamaño

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  altaProteina?: boolean; // Productos con más de 20g de proteína

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  bajasCaloria?: boolean; // Productos con menos de 200 calorías

  // Filtros para clientes específicos
  @IsOptional()
  @IsString()
  clienteId?: string; // Para aplicar preferencias del cliente

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  soloFavoritos?: boolean; // Solo productos favoritos del cliente

  // Ordenamiento y paginación
  @IsOptional()
  @IsEnum(['nombre', 'precio', 'proteina', 'calorias', 'fechaCreacion'], {
    message: 'El campo de ordenamiento debe ser: nombre, precio, proteina, calorias, fechaCreacion'
  })
  sortBy?: 'nombre' | 'precio' | 'proteina' | 'calorias' | 'fechaCreacion';

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'El orden debe ser: asc o desc'
  })
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El offset debe ser un número' })
  @Min(0, { message: 'El offset mínimo es 0' })
  offset?: number;

  // Opciones de inclusión de relaciones
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeCategoria?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeSabor?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeTamano?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeEstadisticas?: boolean; // Incluir estadísticas del producto
}

// ==========================================
// RESPONSE INTERFACES
// ==========================================

export interface AdvancedProductSearchResponse {
  productos: ProductoAvanzadoDto[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
    offset: number;
  };
  filtros: {
    aplicados: string[];
    disponibles: FiltrosDisponibles;
  };
  estadisticas?: EstadisticasBusqueda;
}

export interface ProductoAvanzadoDto {
  // Información básica del producto
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioFormateado: string;

  // Información nutricional
  proteina: number | null;
  calorias: number | null;
  volumen: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  fibra: number | null;
  azucar: number | null;

  // Información adicional
  urlImagen: string | null;
  ingredientes: string[];
  etiquetas: string[];
  momentosRecomendados: MomentoDelDia[];

  // Características calculadas
  tieneDescripcion: boolean;
  tieneImagen: boolean;
  tieneIngredientes: boolean;
  tieneEtiquetas: boolean;
  tieneMomentosRecomendados: boolean;
  tieneInfoNutricional: boolean;
  esProductoCompleto: boolean;
  esAltaProteina: boolean;
  esBajasCaloria: boolean;

  // Relaciones (opcionales)
  categoria?: {
    id: string;
    nombre: string;
    tipoProducto: TipoProducto;
    descripcion: string | null;
  };

  sabor?: {
    id: string;
    nombre: string;
    descripcion: string | null;
  };

  tamano?: {
    id: string;
    nombre: string;
    volumen: number;
    proteina: number;
    volumenEnLitros: number;
    categoria: string; // "Pequeño", "Mediano", "Grande"
  };

  // Información específica del cliente (si aplica)
  esFavorito?: boolean;
  esLibreAlergenos?: boolean;
  compatibilidadCliente?: {
    sinAlergenos: boolean;
    coincidePreferencias: boolean;
    recomendadoParaObjetivo: boolean;
  };

  // Estadísticas (si se incluyen)
  estadisticas?: {
    popularidad: number; // 0-100
    recomendacionesTotales: number;
    consumosTotales: number;
    calificacionPromedio: number; // 0-5 (si tienes sistema de calificaciones)
  };

  // Timestamps
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface FiltrosDisponibles {
  categorias: Array<{
    id: string;
    nombre: string;
    tipoProducto: TipoProducto;
    productosCount: number;
  }>;
  sabores: Array<{
    id: string;
    nombre: string;
    productosCount: number;
  }>;
  tamanos: Array<{
    id: string;
    nombre: string;
    volumen: number;
    productosCount: number;
  }>;
  rangoPrecio: {
    min: number;
    max: number;
  };
  rangoProteina: {
    min: number;
    max: number;
  };
  rangoCalorias: {
    min: number;
    max: number;
  };
  etiquetasPopulares: string[];
  momentosPopulares: MomentoDelDia[];
}

export interface EstadisticasBusqueda {
  totalProductos: number;
  productosConImagen: number;
  productosCompletos: number;
  productosAltaProteina: number;
  productosBajasCaloria: number;
  precioPromedio: number;
  proteinaPromedio: number;
  caloriasPromedio: number;
  categoriasMasPopulares: Array<{
    nombre: string;
    count: number;
  }>;
  saboresMasPopulares: Array<{
    nombre: string;
    count: number;
  }>;
  etiquetasComunes: Array<{
    etiqueta: string;
    count: number;
  }>;
}
