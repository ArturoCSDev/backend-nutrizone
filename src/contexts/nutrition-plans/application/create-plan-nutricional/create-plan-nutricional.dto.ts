import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsPositive, IsArray, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ObjetivoNutricional } from '@prisma/client';

export class CreatePlanNutricionalDto {
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsString({ message: 'El ID del cliente debe ser una cadena' })
  clienteId: string;

  @IsNotEmpty({ message: 'El objetivo nutricional es requerido' })
  @IsEnum(ObjetivoNutricional, { message: 'El objetivo debe ser un valor válido' })
  objetivo: ObjetivoNutricional;

  @IsOptional()
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @IsPositive({ message: 'La duración debe ser un número positivo' })
  @Transform(({ value }) => parseInt(value))
  duracionDias?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fechaInicio?: string;

  @IsOptional()
  @IsArray({ message: 'Los productos favoritos deben ser un array' })
  @IsString({ each: true, message: 'Cada producto favorito debe ser una cadena' })
  productosFavoritos?: string[];

  @IsOptional()
  @IsArray({ message: 'Las preferencias dietéticas deben ser un array' })
  @IsString({ each: true, message: 'Cada preferencia dietética debe ser una cadena' })
  preferenciasDieteticas?: string[];

  @IsOptional()
  @IsArray({ message: 'Los alergenos deben ser un array' })
  @IsString({ each: true, message: 'Cada alergeno debe ser una cadena' })
  alergenos?: string[];

  @IsOptional()
  @IsArray({ message: 'Los días de entrenamiento deben ser un array' })
  @IsString({ each: true, message: 'Cada día de entrenamiento debe ser una cadena' })
  diasEntrenamiento?: string[];

  @IsOptional()
  @IsArray({ message: 'Los horarios de entrenamiento deben ser un array' })
  @IsString({ each: true, message: 'Cada horario debe ser una cadena' })
  horariosEntrenamiento?: string[];

  @IsOptional()
  @IsString({ message: 'La hora de despertar debe ser una cadena' })
  horaDespertar?: string;

  @IsOptional()
  @IsString({ message: 'La hora de dormir debe ser una cadena' })
  horaDormir?: string;

  // Información física adicional (opcional)
  @IsOptional()
  @IsNumber({}, { message: 'El peso inicial debe ser un número' })
  @IsPositive({ message: 'El peso inicial debe ser un número positivo' })
  @Transform(({ value }) => parseFloat(value))
  pesoInicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje de grasa debe ser un número' })
  @IsPositive({ message: 'El porcentaje de grasa debe ser un número positivo' })
  @Transform(({ value }) => parseFloat(value))
  grasaInicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La masa muscular debe ser un número' })
  @IsPositive({ message: 'La masa muscular debe ser un número positivo' })
  @Transform(({ value }) => parseFloat(value))
  muscularInicial?: number;
}

// DTO para la respuesta
export interface CreatePlanNutricionalResponseDto {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion: string;
  objetivo: ObjetivoNutricional;
  duracionDias: number;
  fechaInicio: string;
  fechaFin: string | null;
  caloriasObjetivo: number;
  proteinaObjetivo: number;
  carbohidratosObjetivo: number;
  grasasObjetivo: number;
  instruccionesGenerales: string;
  recomendaciones: RecomendacionResponseDto[];
  fechaCreacion: string;
}

export interface RecomendacionResponseDto {
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
  fechaCreacion: string;
}