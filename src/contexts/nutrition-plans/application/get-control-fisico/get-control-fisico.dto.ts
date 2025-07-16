import { IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetControlFisicoDto {
  @IsNotEmpty({ message: 'Control ID is required' })
  @IsUUID(4, { message: 'Control ID must be a valid UUID' })
  id: string;

  // ✅ PARÁMETROS PARA DATOS EXTENDIDOS
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeStatistics?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeTrends?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeComparisons?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  @Transform(({ value }) => parseInt(value))
  statisticsDays?: number = 90;
}

// ✅ INTERFACES SIMPLIFICADAS PARA LA RESPUESTA
export interface MetricPoint {
  fecha: string;
  valor: number;
  isCurrentControl?: boolean;
}

export interface TrendAnalysis {
  trend: 'ASCENDING' | 'DESCENDING' | 'STABLE';
  percentage: number;
  description: string;
  isPositive: boolean;
}

export interface MetricStatistics {
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
  min: number;
  max: number;
  average: number;
  median: number;
  standardDeviation: number;
  dataPoints: MetricPoint[];
  trend: TrendAnalysis;
  hasImprovement: boolean;
  improvementMessage: string;
}

export interface ControlFisicoStatistics {
  peso: MetricStatistics;
  grasaCorporal: MetricStatistics;
  masaMuscular: MetricStatistics;
  nivelEnergia: MetricStatistics;
  estadoAnimo: MetricStatistics;
  imc: MetricStatistics;
}

export interface ChartData {
  weightChart: MetricPoint[];
  bodyCompositionChart: {
    fecha: string;
    grasaCorporal: number | null;
    masaMuscular: number | null;
    peso: number | null;
  }[];
  wellnessChart: {
    fecha: string;
    nivelEnergia: number | null;
    estadoAnimo: number | null;
  }[];
  progressChart: {
    fecha: string;
    imc: number | null;
    peso: number | null;
    grasaCorporal: number | null;
  }[];
  monthlyAverages: {
    mes: string;
    pesoPromedio: number | null;
    grasaPromedio: number | null;
    musculoPromedio: number | null;
    energiaPromedio: number | null;
  }[];
}

export interface TrendsAnalysis {
  weightLoss: TrendAnalysis;
  muscleGain: TrendAnalysis;
  fatLoss: TrendAnalysis;
  energyImprovement: TrendAnalysis;
  overallProgress: TrendAnalysis;
}

export interface CorrelationAnalysis {
  pesoVsGrasa: number;
  pesoVsMusculo: number;
  energiaVsAnimo: number;
  grasaVsMusculo: number;
  interpretations: {
    strongCorrelations: string[];
    insights: string[];
  };
}

export interface InsightsData {
  achievements: string[];
  concerns: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface PhysicalProgressSummary {
  totalControls: number;
  daysTracked: number;
  firstControlDate: string | null;
  lastControlDate: string | null;
  consistencyRate: number;
  mostActiveMonth: string | null;
  averageTimeBetweenControls: number;
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
  
  // Información del cliente
  cliente: {
    id: string;
    nombre: string;
    edad: number | null;
    peso: number | null;
    altura: number | null;
    genero: string | null;
    hasCompleteProfile: boolean;
    imc: number | null;
  } | null;

  // ✅ DATOS EXTENDIDOS OPCIONALES
  statistics?: ControlFisicoStatistics;
  trends?: TrendsAnalysis;
  chartData?: ChartData;
  correlations?: CorrelationAnalysis;
  insights?: InsightsData;
  progressSummary?: PhysicalProgressSummary;
}