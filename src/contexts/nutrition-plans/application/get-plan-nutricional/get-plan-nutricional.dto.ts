import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPlanNutricionalDto {
  @IsNotEmpty({ message: 'El ID del plan es requerido' })
  @IsString({ message: 'El ID del plan debe ser una cadena' })
  planId: string;

  @IsOptional()
  @IsBoolean({ message: 'includeRecomendaciones debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeRecomendaciones?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'includeProductos debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeProductos?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'includeCliente debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeCliente?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'onlyPendingRecomendaciones debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlyPendingRecomendaciones?: boolean;
}

// DTO para obtener por cliente
export class GetPlanByClienteDto {
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsString({ message: 'El ID del cliente debe ser una cadena' })
  clienteId: string;

  @IsOptional()
  @IsBoolean({ message: 'onlyActive debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlyActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'includeRecomendaciones debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeRecomendaciones?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'includeProductos debe ser un booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeProductos?: boolean;
}

// DTO para la respuesta completa
export interface GetPlanNutricionalResponseDto {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion: string;
  objetivo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  duracion: number | null;
  caloriasObjetivo: number | null;
  proteinaObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  pesoInicial: number | null;
  grasaInicial: number | null;
  muscularInicial: number | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  
  // Información calculada
  diasRestantes: number | null;
  progreso: number; // Porcentaje de progreso (0-100)
  estaActivo: boolean;
  puedeSerModificado: boolean;
  
  // Relaciones opcionales
  cliente?: ClienteInfoDto;
  recomendaciones?: RecomendacionDetalladaDto[];
  resumenRecomendaciones?: ResumenRecomendacionesDto;
}

export interface ClienteInfoDto {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  edad: number | null;
  peso: number | null;
  altura: number | null;
  nivelActividad: string | null;
  genero: string | null;
}

export interface RecomendacionDetalladaDto {
  id: string;
  productoId: string;
  tamanoId: string | null;
  tituloRecomendacion: string;
  iconoProducto: string;
  timingRecomendado: string;
  horarioEspecifico: string | null;
  timingAdicional: string | null;
  prioridad: string;
  razonamiento: string;
  dosis: string;
  frecuencia: string;
  respuestaUsuario: string;
  timingModificado: string | null;
  fechaCreacion: string;
  fechaRespuesta: string | null;
  
  // Información adicional
  esPendiente: boolean;
  esAceptada: boolean;
  esRechazada: boolean;
  haExpirado: boolean;
  
  // Información del producto (si se incluye)
  producto?: ProductoInfoDto;
}

export interface ProductoInfoDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  proteina: number | null;
  calorias: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  categoria?: string;
  sabor?: string;
  tamano?: string;
  urlImagen: string | null;
}

export interface ResumenRecomendacionesDto {
  total: number;
  pendientes: number;
  aceptadas: number;
  rechazadas: number;
  modificadas: number;
  porPrioridad: {
    alta: number;
    media: number;
    baja: number;
  };
  proximasRecomendaciones: RecomendacionDetalladaDto[];
}