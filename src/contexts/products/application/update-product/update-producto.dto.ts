import { 
    IsOptional, 
    IsString, 
    IsNumber, 
    IsArray, 
    IsEnum, 
    MinLength, 
    MaxLength, 
    Min, 
    IsUrl 
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { MomentoDelDia } from '../../domain/models/producto.model';
  
  export class UpdateProductoDto {
    @IsOptional()
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
    @Transform(({ value }) => value?.trim())
    nombre?: string;
  
    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
    @Transform(({ value }) => value?.trim() || null)
    descripcion?: string | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con máximo 2 decimales' })
    @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
    precio?: number;
  
    // Información nutricional
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La proteína debe ser un número' })
    @Min(0, { message: 'La proteína debe ser mayor o igual a 0' })
    proteina?: number | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Las calorías deben ser un número' })
    @Min(0, { message: 'Las calorías deben ser mayor o igual a 0' })
    calorias?: number | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El volumen debe ser un número' })
    @Min(0, { message: 'El volumen debe ser mayor o igual a 0' })
    volumen?: number | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Los carbohidratos deben ser un número' })
    @Min(0, { message: 'Los carbohidratos deben ser mayor o igual a 0' })
    carbohidratos?: number | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Las grasas deben ser un número' })
    @Min(0, { message: 'Las grasas deben ser mayor o igual a 0' })
    grasas?: number | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La fibra debe ser un número' })
    @Min(0, { message: 'La fibra debe ser mayor o igual a 0' })
    fibra?: number | null;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El azúcar debe ser un número' })
    @Min(0, { message: 'El azúcar debe ser mayor o igual a 0' })
    azucar?: number | null;
  
    // Relaciones FK
    @IsOptional()
    @IsString({ message: 'El ID de categoría debe ser una cadena de texto' })
    @Transform(({ value }) => value?.trim() || null)
    categoriaId?: string | null;
  
    @IsOptional()
    @IsString({ message: 'El ID de sabor debe ser una cadena de texto' })
    @Transform(({ value }) => value?.trim() || null)
    saborId?: string | null;
  
    @IsOptional()
    @IsString({ message: 'El ID de tamaño debe ser una cadena de texto' })
    @Transform(({ value }) => value?.trim() || null)
    tamanoId?: string | null;
  
    // Información adicional
    @IsOptional()
    @IsString({ message: 'La URL de imagen debe ser una cadena de texto' })
    @IsUrl({}, { message: 'La URL de imagen debe ser una URL válida' })
    @Transform(({ value }) => value?.trim() || null)
    urlImagen?: string | null;
  
    @IsOptional()
    @IsArray({ message: 'Los ingredientes deben ser un array' })
    @IsString({ each: true, message: 'Cada ingrediente debe ser una cadena de texto' })
    @Transform(({ value }) => value?.map((item: string) => item.trim()).filter((item: string) => item.length > 0) || [])
    ingredientes?: string[];
  
    @IsOptional()
    @IsArray({ message: 'Las etiquetas deben ser un array' })
    @IsString({ each: true, message: 'Cada etiqueta debe ser una cadena de texto' })
    @Transform(({ value }) => value?.map((item: string) => item.trim()).filter((item: string) => item.length > 0) || [])
    etiquetas?: string[];
  
    @IsOptional()
    @IsArray({ message: 'Los momentos recomendados deben ser un array' })
    @IsEnum(MomentoDelDia, { 
      each: true, 
      message: 'Cada momento debe ser uno de: MANANA, PRE_ENTRENAMIENTO, POST_ENTRENAMIENTO, TARDE, NOCHE, ANTES_DORMIR' 
    })
    @Transform(({ value }) => value?.map((item: string) => item.toUpperCase()) || [])
    momentosRecomendados?: MomentoDelDia[];
  }