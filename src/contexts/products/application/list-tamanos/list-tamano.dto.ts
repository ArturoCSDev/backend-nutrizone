import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListTamanoDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El volumen mínimo debe ser un número' })
  @Min(0, { message: 'El volumen mínimo debe ser mayor o igual a 0' })
  volumenMinimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El volumen máximo debe ser un número' })
  @Min(0, { message: 'El volumen máximo debe ser mayor o igual a 0' })
  volumenMaximo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La proteína mínima debe ser un número' })
  @Min(0, { message: 'La proteína mínima debe ser mayor o igual a 0' })
  proteinaMinima?: number;
}