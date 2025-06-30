import { SaborRepository } from '../../domain/repositories/sabor.repository';

export class DeleteSaborUseCase {
  constructor(private readonly saborRepository: SaborRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que el sabor existe
    const sabor = await this.saborRepository.findById(id);
    if (!sabor) {
      throw new Error('El sabor no existe');
    }

    // TODO: Verificar que no tenga productos asociados antes de eliminar
    // const productosAsociados = await this.productoRepository.findBySaborId(id);
    // if (productosAsociados.length > 0) {
    //   throw new Error('No se puede eliminar el sabor porque tiene productos asociados');
    // }

    // Eliminar el sabor
    await this.saborRepository.delete(id);
  }
}