import { ControlFisicoRepository } from '../../domain/repositories/control-fisico.repository';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';
import { ValidationException } from '../../../../shared/core/exceptions/validation.exception';
import { DeleteControlFisicoDto, DeleteControlFisicoResponse } from './delete-control-fisico.dto';

export class DeleteControlFisicoUseCase {
  constructor(
    private controlFisicoRepository: ControlFisicoRepository
  ) {}

  async execute(dto: DeleteControlFisicoDto): Promise<DeleteControlFisicoResponse> {
    // 1. Verificar que el control físico existe
    const existingControl = await this.controlFisicoRepository.findById(dto.id);
    if (!existingControl) {
      throw new NotFoundException('Control físico no encontrado');
    }

    // 2. Validaciones de negocio adicionales (si es necesario)
    // Por ejemplo, podrías validar si el control es muy reciente o tiene restricciones
    const diasDesdeControl = existingControl.diasDesdeControl;
    
    // Opcional: Prevenir eliminación de controles muy antiguos por seguridad de datos
    if (diasDesdeControl > 365) {
      throw new ValidationException('No se pueden eliminar controles físicos de más de un año de antigüedad. Contacte al administrador.');
    }

    // 3. Guardar información del control antes de eliminarlo para la respuesta
    const controlInfo = {
      id: existingControl.id,
      clienteId: existingControl.clienteId,
      fechaControl: existingControl.fechaControl,
      fechaCreacion: existingControl.fechaCreacion
    };

    // 4. Eliminar el control físico
    await this.controlFisicoRepository.delete(dto.id);

    // 5. Preparar la respuesta
    return {
      message: 'Control físico eliminado correctamente',
      deletedControl: controlInfo
    };
  }
}