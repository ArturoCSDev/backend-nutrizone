import { SaborRepository } from '../../domain/repositories/sabor.repository';
import { Sabor } from '../../domain/models/sabor.model';
import { UpdateSaborDto } from './update-sabor.dto';

export class UpdateSaborUseCase {
  constructor(private readonly saborRepository: SaborRepository) {}

  async execute(id: string, updateSaborDto: UpdateSaborDto): Promise<Sabor> {
    // Verificar que el sabor existe
    const saborExistente = await this.saborRepository.findById(id);
    if (!saborExistente) {
      throw new Error('El sabor no existe');
    }

    // Verificar que el nuevo nombre no esté duplicado (si se está actualizando el nombre)
    if (updateSaborDto.nombre && updateSaborDto.nombre !== saborExistente.nombre) {
      const existeNombre = await this.saborRepository.existsByNombreExcludingId(
        updateSaborDto.nombre, 
        id
      );
      if (existeNombre) {
        throw new Error(`Ya existe un sabor con el nombre "${updateSaborDto.nombre}"`);
      }
    }

    // Aplicar las actualizaciones
    let saborActualizado = saborExistente;

    if (updateSaborDto.nombre !== undefined) {
      saborActualizado = saborActualizado.updateNombre(updateSaborDto.nombre);
    }

    if (updateSaborDto.descripcion !== undefined) {
      saborActualizado = saborActualizado.updateDescripcion(updateSaborDto.descripcion);
    }

    // Guardar los cambios
    return await this.saborRepository.update(saborActualizado);
  }
}