import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoProducto } from '../../domain/models/categoria.model';

export class ListCategoriaDto {
  @IsOptional()
  @IsEnum(TipoProducto, { 
    message: 'El tipo de producto debe ser uno de: BATIDO, REFRESCO, WAFFLE' 
  })
  @Transform(({ value }) => value?.toUpperCase())
  tipoProducto?: TipoProducto;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  nombre?: string;
}

// Tipos para la respuesta (Response)
export interface CategoriaResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipoProducto: TipoProducto;
  fechaCreacion: string; // ISO string para serialización
  fechaActualizacion: string; // ISO string para serialización
}

export interface ListCategoriaResponse {
  categorias: CategoriaResponse[];
  total: number;
}
