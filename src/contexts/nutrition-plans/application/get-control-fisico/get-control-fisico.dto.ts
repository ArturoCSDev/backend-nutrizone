import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetControlFisicoDto {
  @IsNotEmpty({ message: 'Control ID is required' })
  @IsUUID(4, { message: 'Control ID must be a valid UUID' })
  id: string;
}

export interface GetControlFisicoResponse {
  controlFisico: {
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
    tieneMetricasFisicas: boolean;
    tieneEvaluacionSubjetiva: boolean;
    isRecentControl: boolean;
    diasDesdeControl: number;
    needsFollowUp: boolean;
    
    // Validaciones
    isValidNivelEnergia: boolean;
    isValidEstadoAnimo: boolean;
    
    // Timestamps
    fechaCreacion: Date;
    fechaActualizacion: Date;
  };
  
  // Información adicional del cliente asociado
  cliente: {
    id: string;
    nombre: string;
    edad: number | null;
    peso: number | null;
    altura: number | null;
    genero: string | null;
    hasCompleteProfile: boolean;
    //imc: number | null;
  } | null;
}