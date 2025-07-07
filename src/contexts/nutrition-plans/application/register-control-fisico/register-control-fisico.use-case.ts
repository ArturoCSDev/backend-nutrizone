import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { ControlFisico } from '../../domain/models/control-fisico.model';
import { ConflictException } from '../../../../shared/core/exceptions/conflict.exception';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { ValidationException } from '../../../../shared/core/exceptions/validation.exception';
import { RegisterControlFisicoDto, RegisterControlFisicoResponse } from './register-control-fisico.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class RegisterControlFisicoUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository,
    private clienteRepository: ClienteRepository
  ) {}

  async execute(dto: RegisterControlFisicoDto): Promise<RegisterControlFisicoResponse> {
    // 1. Validar que el cliente existe
    const cliente = await this.clienteRepository.findById(dto.clienteId);
    
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // 2. Convertir la fecha de control
    const fechaControl = new Date(dto.fechaControl);
    
    // 3. Validar que no exista un control para el mismo cliente en la misma fecha
    const existingControl = await this.controlFisicoRepository.findByClienteIdAndFecha(
      dto.clienteId, 
      fechaControl
    );
    
    if (existingControl) {
      throw new ConflictException('Ya existe un control físico para este cliente en la fecha especificada');
    }

    // 4. Validar que la fecha no sea futura
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final del día actual
    if (fechaControl > today) {
      throw new ValidationException('La fecha del control no puede ser futura');
    }

    // 5. Validar que se proporcione al menos una métrica
    const hasPhysicalMetrics = dto.peso || dto.grasaCorporal || dto.masaMuscular;
    const hasSubjectiveMetrics = dto.nivelEnergia || dto.estadoAnimo;
    const hasAdditionalMeasures = dto.medidasAdicionales && Object.keys(dto.medidasAdicionales).length > 0;
    const hasNotes = dto.notas && dto.notas.trim().length > 0;

    if (!hasPhysicalMetrics && !hasSubjectiveMetrics && !hasAdditionalMeasures && !hasNotes) {
      throw new ValidationException('Debe proporcionar al menos una métrica o nota para el control');
    }

    // 6. Convertir la fecha de próxima cita si existe
    const proximaCita = dto.proximaCita ? new Date(dto.proximaCita) : null;
    
    // 7. Validar que la próxima cita sea futura
    if (proximaCita && proximaCita <= fechaControl) {
      throw new ValidationException('La próxima cita debe ser posterior a la fecha del control actual');
    }

    // 8. Crear el control físico
    const controlFisico = ControlFisico.create({
      clienteId: dto.clienteId,
      planId: dto.planId || null,
      fechaControl,
      peso: dto.peso ? new Decimal(dto.peso) : null,
      grasaCorporal: dto.grasaCorporal ? new Decimal(dto.grasaCorporal) : null,
      masaMuscular: dto.masaMuscular ? new Decimal(dto.masaMuscular) : null,
      medidasAdicionales: dto.medidasAdicionales || null,
      nivelEnergia: dto.nivelEnergia || null,
      estadoAnimo: dto.estadoAnimo || null,
      notas: dto.notas || null,
      realizadoPor: dto.realizadoPor || null,
      proximaCita
    });

    // 9. Validar los ratings antes de guardar
    if (!controlFisico.isValidNivelEnergia()) {
      throw new ValidationException('El nivel de energía debe estar entre 1 y 5');
    }

    if (!controlFisico.isValidEstadoAnimo()) {
      throw new ValidationException('El estado de ánimo debe estar entre 1 y 5');
    }

    // 10. Guardar el control físico
    const savedControlFisico = await this.controlFisicoRepository.save(controlFisico);

    // 11. Preparar la respuesta
    return {
      controlFisico: {
        id: savedControlFisico.id,
        clienteId: savedControlFisico.clienteId,
        fechaControl: savedControlFisico.fechaControl,
        peso: savedControlFisico.peso ? Number(savedControlFisico.peso) : null,
        grasaCorporal: savedControlFisico.grasaCorporal ? Number(savedControlFisico.grasaCorporal) : null,
        masaMuscular: savedControlFisico.masaMuscular ? Number(savedControlFisico.masaMuscular) : null,
        nivelEnergia: savedControlFisico.nivelEnergia,
        estadoAnimo: savedControlFisico.estadoAnimo,
        hasCompleteMetrics: savedControlFisico.hasCompleteMetrics(),
        hasSubjectiveEvaluation: savedControlFisico.hasSubjectiveEvaluation()
      },
      message: 'Control físico registrado correctamente'
    };
  }
}