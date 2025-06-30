import { ProductoRepository } from '../../domain/repositories/producto.repository';
import { Producto } from '../../domain/models/producto.model';
import { UpdateProductoDto } from './update-producto.dto';

export class UpdateProductoUseCase {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async execute(id: string, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    // Verificar que el producto existe
    const productoExistente = await this.productoRepository.findById(id);
    if (!productoExistente) {
      throw new Error('El producto no existe');
    }

    // Verificar que el nuevo nombre no esté duplicado (si se está actualizando el nombre)
    if (updateProductoDto.nombre && updateProductoDto.nombre !== productoExistente.nombre) {
      const existeNombre = await this.productoRepository.existsByNombreExcludingId(
        updateProductoDto.nombre, 
        id
      );
      if (existeNombre) {
        throw new Error(`Ya existe un producto con el nombre "${updateProductoDto.nombre}"`);
      }
    }

    // Aplicar las actualizaciones
    let productoActualizado = productoExistente;

    // Actualizar campos básicos
    if (updateProductoDto.nombre !== undefined) {
      productoActualizado = productoActualizado.updateNombre(updateProductoDto.nombre);
    }

    if (updateProductoDto.descripcion !== undefined) {
      productoActualizado = productoActualizado.updateDescripcion(updateProductoDto.descripcion);
    }

    if (updateProductoDto.precio !== undefined) {
      productoActualizado = productoActualizado.updatePrecio(updateProductoDto.precio);
    }

    // Actualizar información nutricional
    const infoNutricional: any = {};
    if (updateProductoDto.proteina !== undefined) infoNutricional.proteina = updateProductoDto.proteina;
    if (updateProductoDto.calorias !== undefined) infoNutricional.calorias = updateProductoDto.calorias;
    if (updateProductoDto.volumen !== undefined) infoNutricional.volumen = updateProductoDto.volumen;
    if (updateProductoDto.carbohidratos !== undefined) infoNutricional.carbohidratos = updateProductoDto.carbohidratos;
    if (updateProductoDto.grasas !== undefined) infoNutricional.grasas = updateProductoDto.grasas;
    if (updateProductoDto.fibra !== undefined) infoNutricional.fibra = updateProductoDto.fibra;
    if (updateProductoDto.azucar !== undefined) infoNutricional.azucar = updateProductoDto.azucar;

    if (Object.keys(infoNutricional).length > 0) {
      productoActualizado = productoActualizado.updateInfoNutricional(infoNutricional);
    }

    // Actualizar relaciones
    const relaciones: any = {};
    if (updateProductoDto.categoriaId !== undefined) relaciones.categoriaId = updateProductoDto.categoriaId;
    if (updateProductoDto.saborId !== undefined) relaciones.saborId = updateProductoDto.saborId;
    if (updateProductoDto.tamanoId !== undefined) relaciones.tamanoId = updateProductoDto.tamanoId;

    if (Object.keys(relaciones).length > 0) {
      productoActualizado = productoActualizado.updateRelaciones(relaciones);
    }

    // Actualizar información adicional
    if (updateProductoDto.urlImagen !== undefined) {
      productoActualizado = productoActualizado.updateUrlImagen(updateProductoDto.urlImagen);
    }

    if (updateProductoDto.ingredientes !== undefined) {
      productoActualizado = productoActualizado.updateIngredientes(updateProductoDto.ingredientes);
    }

    if (updateProductoDto.etiquetas !== undefined) {
      productoActualizado = productoActualizado.updateEtiquetas(updateProductoDto.etiquetas);
    }

    if (updateProductoDto.momentosRecomendados !== undefined) {
      productoActualizado = productoActualizado.updateMomentosRecomendados(updateProductoDto.momentosRecomendados);
    }

    // Guardar los cambios
    return await this.productoRepository.update(productoActualizado);
  }
}