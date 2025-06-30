import { ProductoRepository } from '../../domain/repositories/producto.repository';
import { Producto } from '../../domain/models/producto.model';
import { CreateProductoDto } from './create-producto.dto';

export class CreateProductoUseCase {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async execute(createProductoDto: CreateProductoDto): Promise<Producto> {
    // Verificar que el nombre no esté duplicado
    const existeProducto = await this.productoRepository.existsByNombre(createProductoDto.nombre);
    if (existeProducto) {
      throw new Error(`Ya existe un producto con el nombre "${createProductoDto.nombre}"`);
    }

    // Crear el producto
    const producto = Producto.create({
      nombre: createProductoDto.nombre,
      descripcion: createProductoDto.descripcion || null,
      precio: createProductoDto.precio,
      // Información nutricional
      proteina: createProductoDto.proteina || null,
      calorias: createProductoDto.calorias || null,
      volumen: createProductoDto.volumen || null,
      carbohidratos: createProductoDto.carbohidratos || null,
      grasas: createProductoDto.grasas || null,
      fibra: createProductoDto.fibra || null,
      azucar: createProductoDto.azucar || null,
      // Relaciones FK
      categoriaId: createProductoDto.categoriaId || null,
      saborId: createProductoDto.saborId || null,
      tamanoId: createProductoDto.tamanoId || null,
      // Información adicional
      urlImagen: createProductoDto.urlImagen || null,
      ingredientes: createProductoDto.ingredientes || [],
      etiquetas: createProductoDto.etiquetas || [],
      momentosRecomendados: createProductoDto.momentosRecomendados || []
    });

    // Guardar en la base de datos
    return await this.productoRepository.save(producto);
  }
}