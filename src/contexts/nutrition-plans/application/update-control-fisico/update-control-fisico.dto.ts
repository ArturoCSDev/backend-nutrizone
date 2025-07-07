import { 
    IsNotEmpty, 
    IsOptional, 
    IsNumber, 
    IsString, 
    IsDateString,
    IsUUID,
    Min,
    Max,
    IsObject
} from 'class-validator';
import { Type } from 'class-transformer';


export interface UpdateControlFisicoDto {
  id: string;
  planId?: string;
  fechaControl?: string;
  peso?: number;
  grasaCorporal?: number;
  masaMuscular?: number;
  medidasAdicionales?: any;
  nivelEnergia?: number;
  estadoAnimo?: number;
  notas?: string;
  realizadoPor?: string;
  proximaCita?: string;
}

export class UpdateControlFisicoHttpDto {
  // Plan opcional al que está asociado
  @IsOptional()
  @IsUUID(4, { message: 'Plan ID must be a valid UUID' })
  planId?: string;

  // Fecha del control
  @IsOptional()
  @IsDateString({}, { message: 'Control date must be a valid date' })
  fechaControl?: string; // ISO string que se convertirá a Date

  // Métricas físicas
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(30, { message: 'Minimum weight is 30 kg' })
  @Max(300, { message: 'Maximum weight is 300 kg' })
  peso?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Body fat must be a number' })
  @Min(3, { message: 'Minimum body fat is 3%' })
  @Max(50, { message: 'Maximum body fat is 50%' })
  grasaCorporal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Muscle mass must be a number' })
  @Min(20, { message: 'Minimum muscle mass is 20 kg' })
  @Max(100, { message: 'Maximum muscle mass is 100 kg' })
  masaMuscular?: number;

  // Medidas adicionales flexibles
  @IsOptional()
  @IsObject({ message: 'Additional measurements must be an object' })
  medidasAdicionales?: any;

  // Evaluación subjetiva
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Energy level must be a number' })
  @Min(1, { message: 'Energy level must be between 1-5' })
  @Max(5, { message: 'Energy level must be between 1-5' })
  nivelEnergia?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Mood must be a number' })
  @Min(1, { message: 'Mood must be between 1-5' })
  @Max(5, { message: 'Mood must be between 1-5' })
  estadoAnimo?: number;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notas?: string;

  // Control administrativo
  @IsOptional()
  @IsString({ message: 'Performed by must be a string' })
  realizadoPor?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Next appointment must be a valid date' })
  proximaCita?: string; // ISO string que se convertirá a Date
}

export interface UpdateControlFisicoResponse {
  controlFisico: {
    id: string;
    clienteId: string;
    fechaControl: Date;
    peso: number | null;
    grasaCorporal: number | null;
    masaMuscular: number | null;
    nivelEnergia: number | null;
    estadoAnimo: number | null;
    hasCompleteMetrics: boolean;
    hasSubjectiveEvaluation: boolean;
    fechaActualizacion: Date;
  };
  message: string;
}