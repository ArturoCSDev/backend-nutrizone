import { IsOptional, IsString, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListControlFisicoDto {
  @IsOptional()
  @IsUUID(4, { message: 'Cliente ID must be a valid UUID' })
  clienteId?: string; // Para filtrar por cliente específico

  @IsOptional()
  @IsUUID(4, { message: 'Plan ID must be a valid UUID' })
  planId?: string; // Para filtrar por plan específico

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date' })
  fechaInicio?: string; // Filtro por rango de fechas

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date' })
  fechaFin?: string; // Filtro por rango de fechas

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyWithMetrics?: boolean; // Solo controles con métricas físicas

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyWithSubjectiveEvaluation?: boolean; // Solo controles con evaluación subjetiva

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyRecent?: boolean; // Solo controles de los últimos 30 días

  @IsOptional()
  @IsString()
  realizadoPor?: string; // Filtrar por quien realizó el control
}

export interface ControlFisicoItem {
  id: string;
  clienteId: string;
  planId: string | null;
  fechaControl: Date;
  
  // Métricas físicas
  peso: number | null;
  grasaCorporal: number | null;
  masaMuscular: number | null;
  medidasAdicionales: any | null;
  
  // Evaluación subjetiva
  nivelEnergia: number | null;
  estadoAnimo: number | null;
  notas: string | null;
  
  // Control administrativo
  realizadoPor: string | null;
  proximaCita: Date | null;
  
  // Metadata calculada
  hasCompleteMetrics: boolean;
  hasSubjectiveEvaluation: boolean;
  isRecentControl: boolean;
  diasDesdeControl: number;
  
  // Timestamps
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface ListControlFisicoResponse {
  controles: ControlFisicoItem[];
  total: number;
  summary: {
    totalWithMetrics: number;
    totalWithoutMetrics: number;
    totalWithSubjectiveEvaluation: number;
    totalWithoutSubjectiveEvaluation: number;
    totalRecent: number; // Últimos 7 días
    averageDaysBetweenControls: number | null;
    latestControl: Date | null;
    oldestControl: Date | null;
  };
}