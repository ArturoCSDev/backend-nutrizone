// src/contexts/nutrition-plans/application/get-control-fisico/get-control-fisico-extended.use-case.ts
import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { UsuarioRepository } from '../../../auth/domain/repositories/usuario.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { GetControlFisicoDto } from './get-control-fisico.dto';

// Interfaces para los datos extendidos
interface ExtendedGetControlFisicoParams {
  includeStatistics?: boolean;
  includeTrends?: boolean;
  includeComparisons?: boolean;
  statisticsDays?: number;
}

interface MetricPoint {
  fecha: string;
  valor: number;
  isCurrentControl?: boolean;
}

interface TrendAnalysis {
  trend: 'ASCENDING' | 'DESCENDING' | 'STABLE';
  percentage: number;
  description: string;
  isPositive: boolean;
}

interface MetricStatistics {
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

interface ControlFisicoStatistics {
  peso: MetricStatistics;
  grasaCorporal: MetricStatistics;
  masaMuscular: MetricStatistics;
  nivelEnergia: MetricStatistics;
  estadoAnimo: MetricStatistics;
  imc: MetricStatistics;
}

interface ChartData {
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

interface TrendsAnalysis {
  weightLoss: TrendAnalysis;
  muscleGain: TrendAnalysis;
  fatLoss: TrendAnalysis;
  energyImprovement: TrendAnalysis;
  overallProgress: TrendAnalysis;
}

interface CorrelationAnalysis {
  pesoVsGrasa: number;
  pesoVsMusculo: number;
  energiaVsAnimo: number;
  grasaVsMusculo: number;
  interpretations: {
    strongCorrelations: string[];
    insights: string[];
  };
}

interface InsightsData {
  achievements: string[];
  concerns: string[];
  recommendations: string[];
  nextSteps: string[];
}

interface PhysicalProgressSummary {
  totalControls: number;
  daysTracked: number;
  firstControlDate: string | null;
  lastControlDate: string | null;
  consistencyRate: number;
  mostActiveMonth: string | null;
  averageTimeBetweenControls: number;
}

export class GetControlFisicoExtendedUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository,
    private clienteRepository: ClienteRepository,
    private usuarioRepository: UsuarioRepository
  ) {}

  async execute(
    dto: GetControlFisicoDto, 
    params?: ExtendedGetControlFisicoParams
  ) {
    // 1. Obtener el control físico base
    const controlFisico = await this.controlFisicoRepository.findById(dto.id);
    if (!controlFisico) {
      throw new NotFoundException('Control físico no encontrado');
    }

    // 2. Obtener cliente y usuario
    const cliente = await this.clienteRepository.findById(controlFisico.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente asociado no encontrado');
    }

    const usuario = await this.usuarioRepository.findById(cliente.usuarioId);

    // 3. Preparar información básica del cliente
    const clienteInfo = {
      id: cliente.id,
      nombre: usuario ? usuario.nombreCompleto : 'Usuario no encontrado',
      edad: cliente.edad,
      peso: cliente.peso ? Number(cliente.peso) : null,
      altura: cliente.altura ? Number(cliente.altura) : null,
      genero: cliente.genero,
      hasCompleteProfile: cliente.hasCompleteProfile(),
      imc: cliente.imc ? Number(cliente.imc) : null
    };

    // 4. Preparar respuesta base
    const baseResponse = {
      controlFisico: {
        id: controlFisico.id,
        clienteId: controlFisico.clienteId,
        planId: controlFisico.planId,
        fechaControl: controlFisico.fechaControl,
        peso: controlFisico.peso ? Number(controlFisico.peso) : null,
        grasaCorporal: controlFisico.grasaCorporal ? Number(controlFisico.grasaCorporal) : null,
        masaMuscular: controlFisico.masaMuscular ? Number(controlFisico.masaMuscular) : null,
        medidasAdicionales: controlFisico.medidasAdicionales,
        nivelEnergia: controlFisico.nivelEnergia,
        estadoAnimo: controlFisico.estadoAnimo,
        notas: controlFisico.notas,
        realizadoPor: controlFisico.realizadoPor,
        proximaCita: controlFisico.proximaCita,
        hasCompleteMetrics: controlFisico.hasCompleteMetrics(),
        hasSubjectiveEvaluation: controlFisico.hasSubjectiveEvaluation(),
        tieneMetricasFisicas: controlFisico.tieneMetricasFisicas,
        tieneEvaluacionSubjetiva: controlFisico.tieneEvaluacionSubjetiva,
        isRecentControl: controlFisico.isRecentControl(),
        diasDesdeControl: controlFisico.diasDesdeControl,
        needsFollowUp: controlFisico.needsFollowUp(),
        isValidNivelEnergia: controlFisico.isValidNivelEnergia(),
        isValidEstadoAnimo: controlFisico.isValidEstadoAnimo(),
        fechaCreacion: controlFisico.fechaCreacion,
        fechaActualizacion: controlFisico.fechaActualizacion
      },
      cliente: clienteInfo
    };

    // 5. Si no se solicitan datos extendidos, retornar respuesta base
    if (!params || (!params.includeStatistics && !params.includeTrends && !params.includeComparisons)) {
      return baseResponse;
    }

    // 6. Obtener historial de controles del cliente para análisis
    const statisticsDays = params.statisticsDays || 90;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - statisticsDays);

    const historialControles = await this.controlFisicoRepository.findByClienteIdWithDateRange(
      controlFisico.clienteId,
      fechaLimite,
      new Date()
    );

    // 7. Generar datos extendidos
    const extendedData: any = {};

    if (params.includeStatistics) {
      extendedData.statistics = await this.generateStatistics(historialControles, controlFisico);
    }

    if (params.includeTrends) {
      extendedData.trends = await this.generateTrends(historialControles);
    }

    if (params.includeComparisons) {
      extendedData.chartData = await this.generateChartData(historialControles);
      extendedData.correlations = await this.generateCorrelations(historialControles);
    }

    // Siempre incluir algunos datos básicos
    extendedData.progressSummary = await this.generateProgressSummary(historialControles);
    extendedData.insights = await this.generateInsights(historialControles, controlFisico);

    return {
      ...baseResponse,
      ...extendedData
    };
  }

  private async generateStatistics(historialControles: any[], currentControl: any): Promise<ControlFisicoStatistics> {
    // Extraer valores para cada métrica
    const pesoValues = historialControles.filter(c => c.peso !== null).map(c => Number(c.peso));
    const grasaValues = historialControles.filter(c => c.grasaCorporal !== null).map(c => Number(c.grasaCorporal));
    const musculoValues = historialControles.filter(c => c.masaMuscular !== null).map(c => Number(c.masaMuscular));
    const energiaValues = historialControles.filter(c => c.nivelEnergia !== null).map(c => c.nivelEnergia);
    const animoValues = historialControles.filter(c => c.estadoAnimo !== null).map(c => c.estadoAnimo);

    return {
      peso: this.calculateMetricStatistics(pesoValues, currentControl.peso, 'peso'),
      grasaCorporal: this.calculateMetricStatistics(grasaValues, currentControl.grasaCorporal, 'grasa'),
      masaMuscular: this.calculateMetricStatistics(musculoValues, currentControl.masaMuscular, 'musculo'),
      nivelEnergia: this.calculateMetricStatistics(energiaValues, currentControl.nivelEnergia, 'energia'),
      estadoAnimo: this.calculateMetricStatistics(animoValues, currentControl.estadoAnimo, 'animo'),
      imc: this.calculateIMCStatistics(historialControles, currentControl)
    };
  }

  private calculateMetricStatistics(values: number[], currentValue: number | null, metricType: string): MetricStatistics {
    if (values.length === 0) {
      return this.getEmptyMetricStatistics(currentValue, metricType);
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Mediana
    const median = values.length % 2 === 0
      ? (sortedValues[values.length / 2 - 1] + sortedValues[values.length / 2]) / 2
      : sortedValues[Math.floor(values.length / 2)];

    // Desviación estándar
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Calcular cambio
    const previous = values.length > 1 ? values[values.length - 2] : null;
    const change = currentValue && previous ? currentValue - previous : null;
    const changePercent = change && previous ? (change / previous) * 100 : null;

    // Generar puntos de datos
    const dataPoints: MetricPoint[] = values.map((valor, index) => ({
      fecha: new Date(Date.now() - (values.length - index) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      valor,
      isCurrentControl: index === values.length - 1
    }));

    // Análisis de tendencia
    const trend = this.calculateTrend(values, metricType);

    // Mensaje de mejora
    const hasImprovement = this.determineImprovement(change, metricType);
    const improvementMessage = this.generateImprovementMessage(hasImprovement, change, metricType);

    return {
      current: currentValue,
      previous,
      change,
      changePercent,
      min,
      max,
      average,
      median,
      standardDeviation,
      dataPoints,
      trend,
      hasImprovement,
      improvementMessage
    };
  }

  private calculateIMCStatistics(historialControles: any[], currentControl: any): MetricStatistics {
    // Calcular IMC para cada control que tenga peso y el cliente tenga altura
    const imcValues: number[] = [];
    
    historialControles.forEach(control => {
      if (control.peso && control.cliente?.altura) {
        const altura = Number(control.cliente.altura) / 100; // convertir cm a metros
        const imc = Number(control.peso) / (altura * altura);
        imcValues.push(imc);
      }
    });

    // IMC actual
    let currentIMC = null;
    if (currentControl.peso && currentControl.cliente?.altura) {
      const altura = Number(currentControl.cliente.altura) / 100;
      currentIMC = Number(currentControl.peso) / (altura * altura);
    }

    return this.calculateMetricStatistics(imcValues, currentIMC, 'imc');
  }

  private calculateTrend(values: number[], metricType: string): TrendAnalysis {
    if (values.length < 2) {
      return {
        trend: 'STABLE',
        percentage: 0,
        description: 'Datos insuficientes para determinar tendencia',
        isPositive: false
      };
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    const percentage = Math.abs((difference / firstAvg) * 100);

    let trend: 'ASCENDING' | 'DESCENDING' | 'STABLE';
    let isPositive: boolean;
    let description: string;

    if (Math.abs(difference) < firstAvg * 0.05) { // Menos del 5% de cambio
      trend = 'STABLE';
      isPositive = true;
      description = `${metricType} se mantiene estable`;
    } else if (difference > 0) {
      trend = 'ASCENDING';
      // Para peso y grasa, subir es negativo; para músculo y energía, subir es positivo
      isPositive = ['musculo', 'energia', 'animo'].includes(metricType);
      description = `${metricType} en tendencia ascendente`;
    } else {
      trend = 'DESCENDING';
      // Para peso y grasa, bajar es positivo; para músculo y energía, bajar es negativo
      isPositive = ['peso', 'grasa', 'imc'].includes(metricType);
      description = `${metricType} en tendencia descendente`;
    }

    return {
      trend,
      percentage,
      description,
      isPositive
    };
  }

  private determineImprovement(change: number | null, metricType: string): boolean {
    if (!change) return false;

    // Para peso, grasa e IMC: reducción es mejora
    // Para músculo, energía y ánimo: aumento es mejora
    const improvementMetrics = ['musculo', 'energia', 'animo'];
    const reductionMetrics = ['peso', 'grasa', 'imc'];

    if (improvementMetrics.includes(metricType)) {
      return change > 0;
    } else if (reductionMetrics.includes(metricType)) {
      return change < 0;
    }

    return false;
  }

  private generateImprovementMessage(hasImprovement: boolean, change: number | null, metricType: string): string {
    if (!change) return 'Sin cambios registrados';

    const metricNames: Record<string, string> = {
      peso: 'peso',
      grasa: 'grasa corporal',
      musculo: 'masa muscular',
      energia: 'nivel de energía',
      animo: 'estado de ánimo',
      imc: 'IMC'
    };

    const metricName = metricNames[metricType] || metricType;

    if (hasImprovement) {
      return `Excelente progreso en ${metricName}`;
    } else {
      return `Se recomienda enfocarse en mejorar ${metricName}`;
    }
  }

  private getEmptyMetricStatistics(currentValue: number | null, metricType: string): MetricStatistics {
    return {
      current: currentValue,
      previous: null,
      change: null,
      changePercent: null,
      min: currentValue || 0,
      max: currentValue || 0,
      average: currentValue || 0,
      median: currentValue || 0,
      standardDeviation: 0,
      dataPoints: currentValue ? [{
        fecha: new Date().toISOString(),
        valor: currentValue,
        isCurrentControl: true
      }] : [],
      trend: {
        trend: 'STABLE',
        percentage: 0,
        description: 'Primer registro',
        isPositive: true
      },
      hasImprovement: false,
      improvementMessage: 'Necesita más datos para análisis'
    };
  }

  private async generateTrends(historialControles: any[]): Promise<TrendsAnalysis> {
    const pesoValues = historialControles.filter(c => c.peso !== null).map(c => Number(c.peso));
    const grasaValues = historialControles.filter(c => c.grasaCorporal !== null).map(c => Number(c.grasaCorporal));
    const musculoValues = historialControles.filter(c => c.masaMuscular !== null).map(c => Number(c.masaMuscular));
    const energiaValues = historialControles.filter(c => c.nivelEnergia !== null).map(c => c.nivelEnergia);

    return {
      weightLoss: this.calculateTrend(pesoValues, 'peso'),
      muscleGain: this.calculateTrend(musculoValues, 'musculo'),
      fatLoss: this.calculateTrend(grasaValues, 'grasa'),
      energyImprovement: this.calculateTrend(energiaValues, 'energia'),
      overallProgress: this.calculateOverallProgress(historialControles)
    };
  }

  private calculateOverallProgress(historialControles: any[]): TrendAnalysis {
    // Lógica simplificada para progreso general
    const improvements = [];
    
    const pesoValues = historialControles.filter(c => c.peso !== null).map(c => Number(c.peso));
    const grasaValues = historialControles.filter(c => c.grasaCorporal !== null).map(c => Number(c.grasaCorporal));
    const musculoValues = historialControles.filter(c => c.masaMuscular !== null).map(c => Number(c.masaMuscular));
    
    if (pesoValues.length > 1) {
      const pesoTrend = this.calculateTrend(pesoValues, 'peso');
      improvements.push(pesoTrend.isPositive ? 1 : -1);
    }
    
    if (grasaValues.length > 1) {
      const grasaTrend = this.calculateTrend(grasaValues, 'grasa');
      improvements.push(grasaTrend.isPositive ? 1 : -1);
    }
    
    if (musculoValues.length > 1) {
      const musculoTrend = this.calculateTrend(musculoValues, 'musculo');
      improvements.push(musculoTrend.isPositive ? 1 : -1);
    }

    const overallScore = improvements.reduce((sum, score) => sum + score, 0);
    const avgScore = improvements.length > 0 ? overallScore / improvements.length : 0;

    return {
      trend: avgScore > 0.3 ? 'ASCENDING' : avgScore < -0.3 ? 'DESCENDING' : 'STABLE',
      percentage: Math.abs(avgScore * 100),
      description: avgScore > 0 ? 'Progreso general positivo' : avgScore < 0 ? 'Necesita mejorar' : 'Progreso estable',
      isPositive: avgScore >= 0
    };
  }

  private async generateChartData(historialControles: any[]): Promise<ChartData> {
    // Ordenar controles por fecha
    const sortedControles = [...historialControles].sort((a, b) => 
      new Date(a.fechaControl).getTime() - new Date(b.fechaControl).getTime()
    );

    // Weight chart
    const weightChart: MetricPoint[] = sortedControles
      .filter(c => c.peso !== null)
      .map(c => ({
        fecha: c.fechaControl.toISOString().split('T')[0],
        valor: Number(c.peso)
      }));

    // Body composition chart
    const bodyCompositionChart = sortedControles.map(c => ({
      fecha: c.fechaControl.toISOString().split('T')[0],
      grasaCorporal: c.grasaCorporal ? Number(c.grasaCorporal) : null,
      masaMuscular: c.masaMuscular ? Number(c.masaMuscular) : null,
      peso: c.peso ? Number(c.peso) : null
    }));

    // Wellness chart
    const wellnessChart = sortedControles.map(c => ({
      fecha: c.fechaControl.toISOString().split('T')[0],
      nivelEnergia: c.nivelEnergia,
      estadoAnimo: c.estadoAnimo
    }));

    // Progress chart (incluye IMC)
    const progressChart = sortedControles.map(c => {
      let imc = null;
      if (c.peso && c.cliente?.altura) {
        const altura = Number(c.cliente.altura) / 100;
        imc = Number(c.peso) / (altura * altura);
      }

      return {
        fecha: c.fechaControl.toISOString().split('T')[0],
        imc,
        peso: c.peso ? Number(c.peso) : null,
        grasaCorporal: c.grasaCorporal ? Number(c.grasaCorporal) : null
      };
    });

    // Monthly averages
    const monthlyAverages = this.calculateMonthlyAverages(sortedControles);

    return {
      weightChart,
      bodyCompositionChart,
      wellnessChart,
      progressChart,
      monthlyAverages
    };
  }

  private calculateMonthlyAverages(controles: any[]): ChartData['monthlyAverages'] {
    const monthlyData: Record<string, any[]> = {};

    controles.forEach(control => {
      const month = new Date(control.fechaControl).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });

      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(control);
    });

    return Object.entries(monthlyData).map(([mes, controlesDelMes]) => {
      const pesoValues = controlesDelMes.filter(c => c.peso).map(c => Number(c.peso));
      const grasaValues = controlesDelMes.filter(c => c.grasaCorporal).map(c => Number(c.grasaCorporal));
      const musculoValues = controlesDelMes.filter(c => c.masaMuscular).map(c => Number(c.masaMuscular));
      const energiaValues = controlesDelMes.filter(c => c.nivelEnergia).map(c => c.nivelEnergia);

      return {
        mes,
        pesoPromedio: pesoValues.length > 0 ? pesoValues.reduce((sum, val) => sum + val, 0) / pesoValues.length : null,
        grasaPromedio: grasaValues.length > 0 ? grasaValues.reduce((sum, val) => sum + val, 0) / grasaValues.length : null,
        musculoPromedio: musculoValues.length > 0 ? musculoValues.reduce((sum, val) => sum + val, 0) / musculoValues.length : null,
        energiaPromedio: energiaValues.length > 0 ? energiaValues.reduce((sum, val) => sum + val, 0) / energiaValues.length : null
      };
    });
  }

  private async generateCorrelations(historialControles: any[]): Promise<CorrelationAnalysis> {
    // Filtrar controles con datos completos para correlaciones
    const controlesCompletos = historialControles.filter(c => 
      c.peso && c.grasaCorporal && c.masaMuscular && c.nivelEnergia && c.estadoAnimo
    );

    if (controlesCompletos.length < 3) {
      return {
        pesoVsGrasa: 0,
        pesoVsMusculo: 0,
        energiaVsAnimo: 0,
        grasaVsMusculo: 0,
        interpretations: {
          strongCorrelations: [],
          insights: ['Datos insuficientes para análisis de correlación']
        }
      };
    }

    // Calcular correlaciones de Pearson
    const pesoValues = controlesCompletos.map(c => Number(c.peso));
    const grasaValues = controlesCompletos.map(c => Number(c.grasaCorporal));
    const musculoValues = controlesCompletos.map(c => Number(c.masaMuscular));
    const energiaValues = controlesCompletos.map(c => c.nivelEnergia);
    const animoValues = controlesCompletos.map(c => c.estadoAnimo);

    const pesoVsGrasa = this.calculateCorrelation(pesoValues, grasaValues);
    const pesoVsMusculo = this.calculateCorrelation(pesoValues, musculoValues);
    const energiaVsAnimo = this.calculateCorrelation(energiaValues, animoValues);
    const grasaVsMusculo = this.calculateCorrelation(grasaValues, musculoValues);

    // Generar interpretaciones
    const strongCorrelations: string[] = [];
    const insights: string[] = [];

    if (Math.abs(pesoVsGrasa) > 0.7) {
      strongCorrelations.push(`Correlación ${pesoVsGrasa > 0 ? 'positiva' : 'negativa'} fuerte entre peso y grasa corporal`);
    }

    if (Math.abs(energiaVsAnimo) > 0.7) {
      strongCorrelations.push('Fuerte correlación entre nivel de energía y estado de ánimo');
      insights.push('El bienestar físico y mental están muy relacionados en tu caso');
    }

    if (Math.abs(grasaVsMusculo) > 0.5) {
      insights.push('Existe una relación notable entre grasa corporal y masa muscular');
    }

    return {
      pesoVsGrasa,
      pesoVsMusculo,
      energiaVsAnimo,
      grasaVsMusculo,
      interpretations: {
        strongCorrelations,
        insights
      }
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private async generateProgressSummary(historialControles: any[]): Promise<PhysicalProgressSummary> {
    if (historialControles.length === 0) {
      return {
        totalControls: 0,
        daysTracked: 0,
        firstControlDate: null,
        lastControlDate: null,
        consistencyRate: 0,
        mostActiveMonth: null,
        averageTimeBetweenControls: 0
      };
    }

    const sortedControles = [...historialControles].sort((a, b) => 
      new Date(a.fechaControl).getTime() - new Date(b.fechaControl).getTime()
    );

    const firstControl = sortedControles[0];
    const lastControl = sortedControles[sortedControles.length - 1];
    
    const firstDate = new Date(firstControl.fechaControl);
    const lastDate = new Date(lastControl.fechaControl);
    const daysTracked = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular promedio de días entre controles
    let totalDaysBetween = 0;
    for (let i = 1; i < sortedControles.length; i++) {
      const prevDate = new Date(sortedControles[i - 1].fechaControl);
      const currentDate = new Date(sortedControles[i].fechaControl);
      totalDaysBetween += Math.ceil((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    const averageTimeBetweenControls = sortedControles.length > 1 ? totalDaysBetween / (sortedControles.length - 1) : 0;

    // Calcular tasa de consistencia (controles esperados vs reales)
    const expectedControls = Math.floor(daysTracked / 7); // Esperando 1 control por semana
    const consistencyRate = expectedControls > 0 ? (historialControles.length / expectedControls) * 100 : 100;

    // Encontrar mes más activo
    const monthCounts: Record<string, number> = {};
    historialControles.forEach(control => {
      const month = new Date(control.fechaControl).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const mostActiveMonth = Object.entries(monthCounts).reduce((max, [month, count]) => 
      count > max.count ? { month, count } : max, 
      { month: '', count: 0 }
    ).month;

    return {
      totalControls: historialControles.length,
      daysTracked,
      firstControlDate: firstControl.fechaControl.toISOString(),
      lastControlDate: lastControl.fechaControl.toISOString(),
      consistencyRate: Math.min(consistencyRate, 100), // Cap at 100%
      mostActiveMonth,
      averageTimeBetweenControls: Math.round(averageTimeBetweenControls)
    };
  }

  private async generateInsights(historialControles: any[], currentControl: any): Promise<InsightsData> {
    const achievements: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    if (historialControles.length < 2) {
      nextSteps.push('Continúa registrando controles para obtener análisis más precisos');
      recommendations.push('Mantén una frecuencia regular de controles físicos');
      return { achievements, concerns, recommendations, nextSteps };
    }

    // Analizar tendencias para generar insights
    const pesoValues = historialControles.filter(c => c.peso !== null).map(c => Number(c.peso));
    const grasaValues = historialControles.filter(c => c.grasaCorporal !== null).map(c => Number(c.grasaCorporal));
    const musculoValues = historialControles.filter(c => c.masaMuscular !== null).map(c => Number(c.masaMuscular));
    const energiaValues = historialControles.filter(c => c.nivelEnergia !== null).map(c => c.nivelEnergia);

    // Analizar peso
    if (pesoValues.length > 1) {
      const pesoChange = pesoValues[pesoValues.length - 1] - pesoValues[0];
      if (pesoChange < -2) {
        achievements.push(`Has perdido ${Math.abs(pesoChange).toFixed(1)}kg en tu seguimiento`);
      } else if (pesoChange > 2) {
        concerns.push('Se observa un aumento de peso considerable');
        recommendations.push('Revisar plan nutricional y actividad física');
      }
    }

    // Analizar grasa corporal
    if (grasaValues.length > 1) {
      const grasaChange = grasaValues[grasaValues.length - 1] - grasaValues[0];
      if (grasaChange < -2) {
        achievements.push(`Reducción de ${Math.abs(grasaChange).toFixed(1)}% en grasa corporal`);
      } else if (grasaChange > 1) {
        concerns.push('Aumento en el porcentaje de grasa corporal');
      }
    }

    // Analizar masa muscular
    if (musculoValues.length > 1) {
      const musculoChange = musculoValues[musculoValues.length - 1] - musculoValues[0];
      if (musculoChange > 1) {
        achievements.push(`Ganancia de ${musculoChange.toFixed(1)}kg en masa muscular`);
      } else if (musculoChange < -1) {
        concerns.push('Pérdida de masa muscular');
        recommendations.push('Incrementar entrenamiento de fuerza y proteína');
      }
    }

    // Analizar energía
    if (energiaValues.length > 1) {
      const energiaPromedio = energiaValues.reduce((sum, val) => sum + val, 0) / energiaValues.length;
      if (energiaPromedio >= 4) {
        achievements.push('Excelentes niveles de energía mantenidos');
      } else if (energiaPromedio < 3) {
        concerns.push('Niveles de energía por debajo del óptimo');
        recommendations.push('Evaluar descanso, nutrición y niveles de estrés');
      }
    }

    // Generar próximos pasos
    if (currentControl.proximaCita) {
      const diasParaCita = Math.ceil((new Date(currentControl.proximaCita).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (diasParaCita > 0) {
        nextSteps.push(`Próxima cita programada en ${diasParaCita} días`);
      } else {
        nextSteps.push('Cita de seguimiento vencida - programar nueva cita');
      }
    } else {
      nextSteps.push('Programar próxima cita de seguimiento');
    }

    // Recomendaciones generales
    if (achievements.length === 0) {
      recommendations.push('Mantener constancia en el seguimiento físico');
    }

    if (historialControles.length >= 4) {
      nextSteps.push('Considerar ajustes en el plan nutricional basado en tendencias');
    }

    return {
      achievements,
      concerns,
      recommendations,
      nextSteps
    };
  }
}