import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MomentoDelDia } from '../../domain/models/producto.model';

export class ListProductoDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El ID de categoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  categoriaId?: string;

  @IsOptional()
  @IsString({ message: 'El ID de sabor debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  saborId?: string;

  @IsOptional()
  @IsString({ message: 'El ID de tamaño debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  tamanoId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio mínimo debe ser un número' })
  @Min(0, { message: 'El precio mínimo debe ser mayor o igual a 0' })
  precioMinimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio máximo debe ser un número' })
  @Min(0, { message: 'El precio máximo debe ser mayor o igual a 0' })
  precioMaximo?: number;

  @IsOptional()
  @IsEnum(MomentoDelDia, { 
    message: 'El momento del día debe ser uno de: MANANA, PRE_ENTRENAMIENTO, POST_ENTRENAMIENTO, TARDE, NOCHE, ANTES_DORMIR' 
  })
  @Transform(({ value }) => value?.toUpperCase())
  momentoDelDia?: MomentoDelDia;

  @IsOptional()
  @IsString({ message: 'La etiqueta debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  etiqueta?: string;
}