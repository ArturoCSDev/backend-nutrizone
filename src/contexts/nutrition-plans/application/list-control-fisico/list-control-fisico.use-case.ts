import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { ListControlFisicoDto, ListControlFisicoResponse, ControlFisicoItem } from './list-control-fisico.dto';

export class ListControlFisicoUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository,
    private clienteRepository: ClienteRepository
  ) {}

  async execute(dto: ListControlFisicoDto = {}): Promise<ListControlFisicoResponse> {
    // 1. Si se especifica clienteId, validar que el cliente existe
    if (dto.clienteId) {
      const cliente = await this.clienteRepository.findById(dto.clienteId);
      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }
    }

    // 2. Obtener controles según filtros
    let controles;
    
    if (dto.clienteId && dto.fechaInicio && dto.fechaFin) {
      // Filtrar por cliente y rango de fechas
      controles = await this.controlFisicoRepository.findByDateRange(
        dto.clienteId,
        new Date(dto.fechaInicio),
        new Date(dto.fechaFin)
      );
    } else if (dto.clienteId && dto.onlyRecent) {
      // Filtrar por cliente y controles recientes (últimos 30 días)
      controles = await this.controlFisicoRepository.findRecentByClienteId(dto.clienteId, 30);
    } else if (dto.clienteId) {
      // Filtrar solo por cliente
      controles = await this.controlFisicoRepository.findByClienteId(dto.clienteId);
    } else if (dto.planId) {
      // Filtrar por plan
      controles = await this.controlFisicoRepository.findByPlanId(dto.planId);
    } else {
      // Obtener todos los controles
      controles = await this.controlFisicoRepository.findMany();
    }

    // 3. Convertir a items de respuesta
    let controlesItems: ControlFisicoItem[] = controles.map(control => ({
      id: control.id,
      clienteId: control.clienteId,
      planId: control.planId,
      fechaControl: control.fechaControl,
      peso: control.peso ? Number(control.peso) : null,
      grasaCorporal: control.grasaCorporal ? Number(control.grasaCorporal) : null,
      masaMuscular: control.masaMuscular ? Number(control.masaMuscular) : null,
      medidasAdicionales: control.medidasAdicionales,
      nivelEnergia: control.nivelEnergia,
      estadoAnimo: control.estadoAnimo,
      notas: control.notas,
      realizadoPor: control.realizadoPor,
      proximaCita: control.proximaCita,
      hasCompleteMetrics: control.hasCompleteMetrics(),
      hasSubjectiveEvaluation: control.hasSubjectiveEvaluation(),
      isRecentControl: control.isRecentControl(),
      diasDesdeControl: control.diasDesdeControl,
      fechaCreacion: control.fechaCreacion,
      fechaActualizacion: control.fechaActualizacion
    }));

    // 4. Aplicar filtros adicionales
    if (dto.onlyWithMetrics !== undefined) {
      controlesItems = controlesItems.filter(control => 
        dto.onlyWithMetrics ? control.hasCompleteMetrics : !control.hasCompleteMetrics
      );
    }

    if (dto.onlyWithSubjectiveEvaluation !== undefined) {
      controlesItems = controlesItems.filter(control => 
        dto.onlyWithSubjectiveEvaluation ? control.hasSubjectiveEvaluation : !control.hasSubjectiveEvaluation
      );
    }

    if (dto.realizadoPor) {
      controlesItems = controlesItems.filter(control => 
        control.realizadoPor?.toLowerCase().includes(dto.realizadoPor!.toLowerCase())
      );
    }

    // 5. Calcular estadísticas del resumen
    const totalWithMetrics = controlesItems.filter(c => c.hasCompleteMetrics).length;
    const totalWithoutMetrics = controlesItems.filter(c => !c.hasCompleteMetrics).length;
    const totalWithSubjectiveEvaluation = controlesItems.filter(c => c.hasSubjectiveEvaluation).length;
    const totalWithoutSubjectiveEvaluation = controlesItems.filter(c => !c.hasSubjectiveEvaluation).length;
    const totalRecent = controlesItems.filter(c => c.isRecentControl).length;

    // Fechas de controles
    const fechasControl = controlesItems.map(c => c.fechaControl).sort((a, b) => a.getTime() - b.getTime());
    const latestControl = fechasControl.length > 0 ? fechasControl[fechasControl.length - 1] : null;
    const oldestControl = fechasControl.length > 0 ? fechasControl[0] : null;

    // Calcular promedio de días entre controles
    let averageDaysBetweenControls: number | null = null;
    if (fechasControl.length > 1) {
      const daysDifferences = [];
      for (let i = 1; i < fechasControl.length; i++) {
        const diffTime = fechasControl[i].getTime() - fechasControl[i - 1].getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysDifferences.push(diffDays);
      }
      const totalDays = daysDifferences.reduce((sum, days) => sum + days, 0);
      averageDaysBetweenControls = Math.round(totalDays / daysDifferences.length);
    }

    // 6. Ordenar por fecha de control (más recientes primero)
    controlesItems.sort((a, b) => new Date(b.fechaControl).getTime() - new Date(a.fechaControl).getTime());

    return {
      controles: controlesItems,
      total: controlesItems.length,
      summary: {
        totalWithMetrics,
        totalWithoutMetrics,
        totalWithSubjectiveEvaluation,
        totalWithoutSubjectiveEvaluation,
        totalRecent,
        averageDaysBetweenControls,
        latestControl,
        oldestControl
      }
    };
  }
}