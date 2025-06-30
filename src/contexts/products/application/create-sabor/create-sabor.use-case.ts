import { SaborRepository } from '../../domain/repositories/sabor.repository';
import { Sabor } from '../../domain/models/sabor.model';
import { CreateSaborDto } from './create-sabor.dto';

export class CreateSaborUseCase {
  constructor(private readonly saborRepository: SaborRepository) {}

  async execute(createSaborDto: CreateSaborDto): Promise<Sabor> {
    // Verificar que el nombre no esté duplicado
    const existeSabor = await this.saborRepository.existsByNombre(createSaborDto.nombre);
    if (existeSabor) {
      throw new Error(`Ya existe un sabor con el nombre "${createSaborDto.nombre}"`);
    }

    // Crear el sabor
    const sabor = Sabor.create({
      nombre: createSaborDto.nombre,
      descripcion: createSaborDto.descripcion || null
    });

    // Guardar en la base de datos
    return await this.saborRepository.save(sabor);
  }
}