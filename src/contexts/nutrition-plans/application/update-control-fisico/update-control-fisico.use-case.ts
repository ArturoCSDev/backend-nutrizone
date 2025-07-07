import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { ValidationException } from '../../../../shared/core/exceptions/validation.exception';
import { ConflictException } from '../../../../shared/core/exceptions/conflict.exception';
import { UpdateControlFisicoDto, UpdateControlFisicoResponse } from './update-control-fisico.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class UpdateControlFisicoUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository
  ) {}

  async execute(dto: UpdateControlFisicoDto): Promise<UpdateControlFisicoResponse> {
    // 1. Buscar el control físico existente
    const existingControl = await this.controlFisicoRepository.findById(dto.id);
    if (!existingControl) {
      throw new NotFoundException('Control físico no encontrado');
    }

    // 2. Validar nueva fecha de control si se proporciona
    let nuevaFechaControl: Date | undefined;
    if (dto.fechaControl) {
      nuevaFechaControl = new Date(dto.fechaControl);
      
      // Validar que la fecha no sea futura
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (nuevaFechaControl > today) {
        throw new ValidationException('La fecha del control no puede ser futura');
      }

      // Si la fecha cambió, validar que no haya conflicto con otro control
      if (nuevaFechaControl.getTime() !== existingControl.fechaControl.getTime()) {
        const conflictingControl = await this.controlFisicoRepository.findByClienteIdAndFecha(
          existingControl.clienteId,
          nuevaFechaControl
        );
        
        if (conflictingControl && conflictingControl.id !== dto.id) {
          throw new ConflictException('Ya existe un control físico para este cliente en la fecha especificada');
        }
      }
    }

    // 3. Validar próxima cita si se proporciona
    let nuevaProximaCita: Date | null = null;
    if (dto.proximaCita !== undefined) {
      if (dto.proximaCita) {
        nuevaProximaCita = new Date(dto.proximaCita);
        const fechaComparacion = nuevaFechaControl || existingControl.fechaControl;
        
        if (nuevaProximaCita <= fechaComparacion) {
          throw new ValidationException('La próxima cita debe ser posterior a la fecha del control');
        }
      }
    } else {
      // Mantener la próxima cita actual si no se especifica
      nuevaProximaCita = existingControl.proximaCita;
    }

    // 4. Crear objeto con campos a actualizar
    const updateData: any = {};
    
    // Actualizar plan si se proporciona
    if (dto.planId !== undefined) {
      updateData.planId = dto.planId || null;
    }

    // Actualizar fecha de control si se proporciona
    if (nuevaFechaControl) {
      updateData.fechaControl = nuevaFechaControl;
    }

    // Actualizar métricas físicas
    if (dto.peso !== undefined) {
      updateData.peso = dto.peso ? new Decimal(dto.peso) : null;
    }
    if (dto.grasaCorporal !== undefined) {
      updateData.grasaCorporal = dto.grasaCorporal ? new Decimal(dto.grasaCorporal) : null;
    }
    if (dto.masaMuscular !== undefined) {
      updateData.masaMuscular = dto.masaMuscular ? new Decimal(dto.masaMuscular) : null;
    }
    if (dto.medidasAdicionales !== undefined) {
      updateData.medidasAdicionales = dto.medidasAdicionales;
    }

    // Actualizar evaluación subjetiva
    if (dto.nivelEnergia !== undefined) {
      updateData.nivelEnergia = dto.nivelEnergia;
    }
    if (dto.estadoAnimo !== undefined) {
      updateData.estadoAnimo = dto.estadoAnimo;
    }
    if (dto.notas !== undefined) {
      updateData.notas = dto.notas || null;
    }

    // Actualizar control administrativo
    if (dto.realizadoPor !== undefined) {
      updateData.realizadoPor = dto.realizadoPor || null;
    }
    if (dto.proximaCita !== undefined) {
      updateData.proximaCita = nuevaProximaCita;
    }

    // 5. Aplicar actualizaciones usando métodos del dominio
    let updatedControl = existingControl;

    // Actualizar métricas físicas si hay cambios
    const hasPhysicalChanges = dto.peso !== undefined || dto.grasaCorporal !== undefined || 
                              dto.masaMuscular !== undefined || dto.medidasAdicionales !== undefined;
    if (hasPhysicalChanges) {
      updatedControl = updatedControl.updateMetricasFisicas({
        peso: updateData.peso !== undefined ? updateData.peso : updatedControl.peso,
        grasaCorporal: updateData.grasaCorporal !== undefined ? updateData.grasaCorporal : updatedControl.grasaCorporal,
        masaMuscular: updateData.masaMuscular !== undefined ? updateData.masaMuscular : updatedControl.masaMuscular,
        medidasAdicionales: updateData.medidasAdicionales !== undefined ? updateData.medidasAdicionales : updatedControl.medidasAdicionales
      });
    }

    // Actualizar evaluación subjetiva si hay cambios
    const hasSubjectiveChanges = dto.nivelEnergia !== undefined || dto.estadoAnimo !== undefined || dto.notas !== undefined;
    if (hasSubjectiveChanges) {
      updatedControl = updatedControl.updateEvaluacionSubjetiva({
        nivelEnergia: updateData.nivelEnergia !== undefined ? updateData.nivelEnergia : updatedControl.nivelEnergia,
        estadoAnimo: updateData.estadoAnimo !== undefined ? updateData.estadoAnimo : updatedControl.estadoAnimo,
        notas: updateData.notas !== undefined ? updateData.notas : updatedControl.notas
      });
    }

    // Actualizar datos administrativos si hay cambios
    const hasAdminChanges = dto.realizadoPor !== undefined || dto.proximaCita !== undefined;
    if (hasAdminChanges) {
      updatedControl = updatedControl.updateAdministrativo({
        realizadoPor: updateData.realizadoPor !== undefined ? updateData.realizadoPor : updatedControl.realizadoPor,
        proximaCita: updateData.proximaCita !== undefined ? updateData.proximaCita : updatedControl.proximaCita
      });
    }
/*
    // Asignar a plan si hay cambios
    if (dto.planId !== undefined && updateData.planId !== updatedControl.planId) {
      if (updateData.planId) {
        updatedControl = updatedControl.assignToPlan(updateData.planId);
      } else {
        // Para remover del plan, necesitamos actualizar manualmente
        updatedControl = new ControlFisico({
          ...updatedControl.toPrimitives(),
          planId: null,
          fechaActualizacion: new Date()
        } as any);
      }
    }

    // Actualizar fecha de control si cambió
    if (nuevaFechaControl && nuevaFechaControl.getTime() !== existingControl.fechaControl.getTime()) {
      updatedControl = new ControlFisico({
        ...updatedControl.toPrimitives(),
        fechaControl: nuevaFechaControl,
        fechaActualizacion: new Date()
      } as any);
    }
*/
    // 6. Validar ratings después de las actualizaciones
    if (!updatedControl.isValidNivelEnergia()) {
      throw new ValidationException('El nivel de energía debe estar entre 1 y 5');
    }

    if (!updatedControl.isValidEstadoAnimo()) {
      throw new ValidationException('El estado de ánimo debe estar entre 1 y 5');
    }

    // 7. Guardar los cambios
    const savedControl = await this.controlFisicoRepository.update(updatedControl);

    // 8. Preparar la respuesta
    return {
      controlFisico: {
        id: savedControl.id,
        clienteId: savedControl.clienteId,
        fechaControl: savedControl.fechaControl,
        peso: savedControl.peso ? Number(savedControl.peso) : null,
        grasaCorporal: savedControl.grasaCorporal ? Number(savedControl.grasaCorporal) : null,
        masaMuscular: savedControl.masaMuscular ? Number(savedControl.masaMuscular) : null,
        nivelEnergia: savedControl.nivelEnergia,
        estadoAnimo: savedControl.estadoAnimo,
        hasCompleteMetrics: savedControl.hasCompleteMetrics(),
        hasSubjectiveEvaluation: savedControl.hasSubjectiveEvaluation(),
        fechaActualizacion: savedControl.fechaActualizacion
      },
      message: 'Control físico actualizado correctamente'
    };
  }
}