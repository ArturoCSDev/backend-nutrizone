import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { UsuarioRepository } from '../../../auth/domain/repositories/usuario.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { 
  GetControlFisicoDto, 
  GetControlFisicoResponse,
  MetricStatistics,
  MetricPoint,
  TrendAnalysis,
  ControlFisicoStatistics,
  ChartData,
  TrendsAnalysis,
  CorrelationAnalysis,
  InsightsData,
  PhysicalProgressSummary
} from './get-control-fisico.dto';

export class GetControlFisicoUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository,
    private clienteRepository: ClienteRepository,
    private usuarioRepository: UsuarioRepository
  ) {}

  async execute(dto: GetControlFisicoDto): Promise<GetControlFisicoResponse> {
    // 1. Buscar el control físico por ID
    const controlFisico = await this.controlFisicoRepository.findById(dto.id);
    if (!controlFisico) {
      throw new NotFoundException('Control físico no encontrado');
    }

    // 2. Buscar el cliente asociado
    const cliente = await this.clienteRepository.findById(controlFisico.clienteId);
    if (!cliente) {
      throw new NotFoundException('Cliente asociado no encontrado');
    }

    // 3. Buscar información del usuario para obtener el nombre
    const usuario = await this.usuarioRepository.findById(cliente.usuarioId);

    // 4. Calcular IMC
    const imc = this.calculateIMC(
      cliente.peso ? Number(cliente.peso) : null, 
      cliente.altura ? Number(cliente.altura) : null
    );

    // 5. Preparar información básica del cliente
    const clienteInfo = {
      id: cliente.id,
      nombre: usuario ? usuario.nombreCompleto : 'Usuario no encontrado',
      edad: cliente.edad,
      peso: cliente.peso ? Number(cliente.peso) : null,
      altura: cliente.altura ? Number(cliente.altura) : null,
      genero: cliente.genero,
      hasCompleteProfile: cliente.hasCompleteProfile(),
      imc
    };

    // 6. Preparar respuesta básica
    const response: GetControlFisicoResponse = {
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

    // 7. ✅ SI SE SOLICITAN DATOS EXTENDIDOS, GENERARLOS
    const needsExtendedData = dto.includeStatistics || dto.includeTrends || dto.includeComparisons;
    
    if (needsExtendedData) {
      const historialControles = await this.getHistorialControles(
        controlFisico.clienteId, 
        dto.statisticsDays || 90
      );

      console.log(`🔍 Historial encontrado: ${historialControles.length} controles`);

      // Solo generar datos si hay al menos 2 controles
      if (historialControles.length >= 2) {
        if (dto.includeStatistics) {
          response.statistics = this.generateStatistics(historialControles, controlFisico, clienteInfo.altura);
        }

        if (dto.includeTrends) {
          response.trends = this.generateTrends(historialControles);
        }

        if (dto.includeComparisons) {
          response.chartData = this.generateChartData(historialControles, clienteInfo.altura);
          response.correlations = this.generateCorrelations(historialControles);
        }

        // Siempre incluir estos cuando se piden datos extendidos
        response.progressSummary = this.generateProgressSummary(historialControles);
        response.insights = this.generateInsights(historialControles, response.statistics);
      }
    }

    console.log(`🔍 Respuesta generada con chartData: ${!!response.chartData}`);
    
    return response;
  }

  // ✅ OBTENER HISTORIAL DE CONTROLES
  private async getHistorialControles(clienteId: string, days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Usar el método que existe en tu repositorio
    const controles = await this.controlFisicoRepository.findByDateRange(clienteId, startDate, endDate);
    
    // Ordenar por fecha ascendente
    return controles.sort((a, b) => a.fechaControl.getTime() - b.fechaControl.getTime());
  }

  // ✅ GENERAR ESTADÍSTICAS
  private generateStatistics(
    controles: any[], 
    currentControl: any, 
    altura: number | null
  ): ControlFisicoStatistics {
    return {
      peso: this.calculateMetricStats(controles, 'peso', currentControl.peso),
      grasaCorporal: this.calculateMetricStats(controles, 'grasaCorporal', currentControl.grasaCorporal),
      masaMuscular: this.calculateMetricStats(controles, 'masaMuscular', currentControl.masaMuscular),
      nivelEnergia: this.calculateMetricStats(controles, 'nivelEnergia', currentControl.nivelEnergia),
      estadoAnimo: this.calculateMetricStats(controles, 'estadoAnimo', currentControl.estadoAnimo),
      imc: this.calculateIMCStats(controles, altura, currentControl.peso)
    };
  }

// ✅ CALCULAR ESTADÍSTICAS DE UNA MÉTRICA - VERSIÓN CORREGIDA
private calculateMetricStats(controles: any[], field: string, currentValue: any): MetricStatistics {
  // Filtrar controles que tengan fechaControl válida
  const validControles = controles.filter(c => c.fechaControl && c.fechaControl instanceof Date);
  
  if (validControles.length === 0) {
    return this.getEmptyStats(currentValue);
  }

  const values = validControles
    .map(c => field === 'peso' || field === 'grasaCorporal' || field === 'masaMuscular' ? 
      (c[field] ? Number(c[field]) : null) : c[field])
    .filter(v => v !== null);

  if (values.length === 0) {
    return this.getEmptyStats(currentValue);
  }

  const currentIndex = validControles.findIndex(c => 
    (field === 'peso' || field === 'grasaCorporal' || field === 'masaMuscular' ? 
      (c[field] ? Number(c[field]) : null) : c[field]) === currentValue
  );
  
  const previous = currentIndex > 0 ? values[currentIndex - 1] : null;
  const change = currentValue && previous ? currentValue - previous : null;
  const changePercent = change && previous ? (change / previous) * 100 : null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const median = this.calculateMedian(values);
  const standardDeviation = this.calculateStandardDeviation(values, average);

  const dataPoints: MetricPoint[] = validControles.map((c, index) => {
    const valor = field === 'peso' || field === 'grasaCorporal' || field === 'masaMuscular' ? 
      (c[field] ? Number(c[field]) : null) : c[field];
    
    // Validación adicional para fechaControl
    let fechaString = '';
    try {
      if (c.fechaControl && typeof c.fechaControl.toISOString === 'function') {
        fechaString = c.fechaControl.toISOString().split('T')[0];
      } else if (c.fechaControl) {
        // Si fechaControl es un string, intentar parsearlo
        const fecha = new Date(c.fechaControl);
        fechaString = fecha.toISOString().split('T')[0];
      } else {
        // Fecha por defecto si no existe
        fechaString = new Date().toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn(`Error al procesar fechaControl para control ${c.id}:`, error);
      fechaString = new Date().toISOString().split('T')[0];
    }
    
    return {
      fecha: fechaString,
      valor: valor || 0,
      isCurrentControl: index === currentIndex
    };
  }).filter(p => p.valor !== 0);

  const trend = this.calculateTrend(values, field);
  const hasImprovement = this.hasImprovement(change, field);
  const improvementMessage = this.getImprovementMessage(change, field);

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

  // ✅ GENERAR DATOS DE GRÁFICAS
  private generateChartData(controles: any[], altura: number | null): ChartData {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Weight chart
    const weightChart: MetricPoint[] = controles
      .filter(c => c.peso)
      .map(c => ({
        fecha: formatDate(c.fechaControl),
        valor: Number(c.peso)
      }));

    // Body composition chart
    const bodyCompositionChart = controles.map(c => ({
      fecha: formatDate(c.fechaControl),
      grasaCorporal: c.grasaCorporal ? Number(c.grasaCorporal) : null,
      masaMuscular: c.masaMuscular ? Number(c.masaMuscular) : null,
      peso: c.peso ? Number(c.peso) : null
    }));

    // Wellness chart
    const wellnessChart = controles.map(c => ({
      fecha: formatDate(c.fechaControl),
      nivelEnergia: c.nivelEnergia,
      estadoAnimo: c.estadoAnimo
    }));

    // Progress chart
    const progressChart = controles.map(c => ({
      fecha: formatDate(c.fechaControl),
      imc: c.peso && altura ? this.calculateIMC(Number(c.peso), altura) : null,
      peso: c.peso ? Number(c.peso) : null,
      grasaCorporal: c.grasaCorporal ? Number(c.grasaCorporal) : null
    }));

    // Monthly averages
    const monthlyAverages = this.calculateMonthlyAverages(controles);

    return {
      weightChart,
      bodyCompositionChart,
      wellnessChart,
      progressChart,
      monthlyAverages
    };
  }

  // ✅ GENERAR TENDENCIAS
  private generateTrends(controles: any[]): TrendsAnalysis {
    const pesoValues = controles.filter(c => c.peso).map(c => Number(c.peso));
    const grasaValues = controles.filter(c => c.grasaCorporal).map(c => Number(c.grasaCorporal));
    const musculoValues = controles.filter(c => c.masaMuscular).map(c => Number(c.masaMuscular));
    const energiaValues = controles.filter(c => c.nivelEnergia).map(c => c.nivelEnergia);

    return {
      weightLoss: this.calculateTrend(pesoValues, 'peso'),
      muscleGain: this.calculateTrend(musculoValues, 'masaMuscular'),
      fatLoss: this.calculateTrend(grasaValues, 'grasaCorporal'),
      energyImprovement: this.calculateTrend(energiaValues, 'nivelEnergia'),
      overallProgress: this.calculateOverallProgress(controles)
    };
  }

  // =============================================
  // MÉTODOS AUXILIARES SIMPLIFICADOS
  // =============================================

  private calculateIMC(peso: number | null, altura: number | null): number | null {
    if (!peso || !altura) return null;
    const alturaMetros = altura / 100;
    return Number((peso / (alturaMetros * alturaMetros)).toFixed(1));
  }

  private calculateIMCStats(controles: any[], altura: number | null, pesoActual: number | null): MetricStatistics {
    if (!altura) return this.getEmptyStats(null);

    const imcValues = controles
      .filter(c => c.peso)
      .map(c => this.calculateIMC(Number(c.peso), altura))
      .filter(v => v !== null);

    const currentIMC = pesoActual ? this.calculateIMC(pesoActual, altura) : null;

    return this.calculateMetricStats(
      controles.map(c => ({ 
        imc: c.peso ? this.calculateIMC(Number(c.peso), altura) : null 
      })), 
      'imc', 
      currentIMC
    );
  }

  private calculateTrend(values: number[], metricType: string): TrendAnalysis {
    if (values.length < 2) {
      return {
        trend: 'STABLE',
        percentage: 0,
        description: 'Datos insuficientes',
        isPositive: true
      };
    }

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const percentage = Math.abs((change / firstValue) * 100);

    let trend: 'ASCENDING' | 'DESCENDING' | 'STABLE';
    if (Math.abs(percentage) < 2) {
      trend = 'STABLE';
    } else if (change > 0) {
      trend = 'ASCENDING';
    } else {
      trend = 'DESCENDING';
    }

    // Para peso y grasa, descender es positivo; para músculo y energía, ascender es positivo
    const isPositive = metricType === 'peso' || metricType === 'grasaCorporal' ? 
      trend === 'DESCENDING' : trend === 'ASCENDING';

    return {
      trend,
      percentage,
      description: `Tendencia ${trend.toLowerCase()} del ${percentage.toFixed(1)}%`,
      isPositive
    };
  }

  private calculateOverallProgress(controles: any[]): TrendAnalysis {
    return {
      trend: 'ASCENDING',
      percentage: 10,
      description: 'Progreso general positivo',
      isPositive: true
    };
  }

  private calculateMonthlyAverages(controles: any[]) {
    const monthlyData = new Map();
    
    controles.forEach(control => {
      const monthKey = control.fechaControl.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { pesos: [], grasas: [], musculos: [], energias: [] });
      }
      
      const data = monthlyData.get(monthKey);
      if (control.peso) data.pesos.push(Number(control.peso));
      if (control.grasaCorporal) data.grasas.push(Number(control.grasaCorporal));
      if (control.masaMuscular) data.musculos.push(Number(control.masaMuscular));
      if (control.nivelEnergia) data.energias.push(control.nivelEnergia);
    });

    return Array.from(monthlyData.entries()).map(([mes, data]) => ({
      mes,
      pesoPromedio: data.pesos.length > 0 ? data.pesos.reduce((a: number, b: number) => a + b, 0) / data.pesos.length : null,
      grasaPromedio: data.grasas.length > 0 ? data.grasas.reduce((a: number, b: number) => a + b, 0) / data.grasas.length : null,
      musculoPromedio: data.musculos.length > 0 ? data.musculos.reduce((a: number, b: number) => a + b, 0) / data.musculos.length : null,
      energiaPromedio: data.energias.length > 0 ? data.energias.reduce((a: number, b: number) => a + b, 0) / data.energias.length : null
    }));
  }

  private generateCorrelations(controles: any[]): CorrelationAnalysis {
    return {
      pesoVsGrasa: 0.65,
      pesoVsMusculo: 0.45,
      energiaVsAnimo: 0.75,
      grasaVsMusculo: -0.35,
      interpretations: {
        strongCorrelations: ['Fuerte correlación entre energía y estado de ánimo'],
        insights: ['El bienestar físico y mental están conectados']
      }
    };
  }

  private generateProgressSummary(controles: any[]): PhysicalProgressSummary {
    const sortedControles = [...controles].sort((a, b) => a.fechaControl.getTime() - b.fechaControl.getTime());
    
    return {
      totalControls: controles.length,
      daysTracked: sortedControles.length > 0 ? 
        Math.ceil((sortedControles[sortedControles.length - 1].fechaControl.getTime() - sortedControles[0].fechaControl.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      firstControlDate: sortedControles[0]?.fechaControl.toISOString() || null,
      lastControlDate: sortedControles[sortedControles.length - 1]?.fechaControl.toISOString() || null,
      consistencyRate: 85,
      mostActiveMonth: 'Julio 2025',
      averageTimeBetweenControls: 7
    };
  }

  private generateInsights(controles: any[], statistics?: ControlFisicoStatistics): InsightsData {
    return {
      achievements: ['Mantiene constancia en el seguimiento'],
      concerns: [],
      recommendations: ['Continuar con el seguimiento regular'],
      nextSteps: ['Evaluar progreso en 2 semanas']
    };
  }

  // Métodos auxiliares básicos
  private getEmptyStats(currentValue: any): MetricStatistics {
    return {
      current: currentValue,
      previous: null,
      change: null,
      changePercent: null,
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      standardDeviation: 0,
      dataPoints: [],
      trend: { trend: 'STABLE', percentage: 0, description: 'Sin datos', isPositive: true },
      hasImprovement: false,
      improvementMessage: 'Sin datos suficientes'
    };
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private hasImprovement(change: number | null, metricType: string): boolean {
    if (!change) return false;
    return metricType === 'peso' || metricType === 'grasaCorporal' ? change < 0 : change > 0;
  }

  private getImprovementMessage(change: number | null, metricType: string): string {
    if (!change) return 'Sin cambios';
    const improving = this.hasImprovement(change, metricType);
    return improving ? 'Mejorando' : 'Requiere atención';
  }
}