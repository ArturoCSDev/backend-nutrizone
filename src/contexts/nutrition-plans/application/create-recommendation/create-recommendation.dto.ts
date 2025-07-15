import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Prioridad } from '@prisma/client';

export class CreateRecommendationDto {
  @IsString()
  clienteId: string;

  @IsString()
  @IsOptional()
  planId?: string; // Si no se proporciona, se usa el plan activo

  @IsString()
  @IsOptional()
  contexto?: string; // "pre_entreno", "post_entreno", "desayuno", etc.

  @IsString()
  @IsOptional()
  objetivoEspecifico?: string; // "necesito energía", "quiero proteína", etc.

  @IsEnum(Prioridad)
  @IsOptional()
  prioridadMinima?: Prioridad;

  @IsBoolean()
  @IsOptional()
  soloFavoritos?: boolean; // Solo recomendar productos favoritos

  @IsString()
  @IsOptional()
  momentoDelDia?: string; // "MANANA", "PRE_ENTRENAMIENTO", etc.
}
