import { ProductoRepository } from '../../domain/repositories/producto.repository';

export class DeleteProductoUseCase {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que el producto existe
    const producto = await this.productoRepository.findById(id);
    if (!producto) {
      throw new Error('El producto no existe');
    }

    // TODO: Verificar que no tenga consumos o recomendaciones asociadas antes de eliminar
    // const consumosAsociados = await this.consumoRepository.findByProductoId(id);
    // if (consumosAsociados.length > 0) {
    //   throw new Error('No se puede eliminar el producto porque tiene consumos asociados');
    // }

    // Eliminar el producto
    await this.productoRepository.delete(id);
  }
}