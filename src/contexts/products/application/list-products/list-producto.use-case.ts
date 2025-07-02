import { ProductoRepository } from '../../domain/repositories/producto.repository';
import { Producto } from '../../domain/models/producto.model';
import { ListProductoDto } from './list-producto.dto';
import { ProductoMapper } from '../../infrastructure/mappers/producto.mapper'; // ✅ IMPORTAR MAPPER

export interface ListProductoResponse {
  productos: ReturnType<typeof ProductoMapper.toResponse>[]; // ✅ USAR TIPO DEL MAPPER
  total: number;
}

export class ListProductoUseCase {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async execute(filters: ListProductoDto): Promise<ListProductoResponse> {
    let productos: Producto[];

    // Comenzar con todos los productos
    productos = await this.productoRepository.findMany();

    // Aplicar filtros específicos
    if (filters.categoriaId) {
      productos = productos.filter(producto => producto.categoriaId === filters.categoriaId);
    }

    if (filters.saborId) {
      productos = productos.filter(producto => producto.saborId === filters.saborId);
    }

    if (filters.tamanoId) {
      productos = productos.filter(producto => producto.tamanoId === filters.tamanoId);
    }

    // Filtrar por rango de precios
    if (filters.precioMinimo !== undefined || filters.precioMaximo !== undefined) {
      const minPrecio = filters.precioMinimo ?? 0;
      const maxPrecio = filters.precioMaximo ?? Number.MAX_SAFE_INTEGER;
      
      productos = productos.filter(producto => 
        producto.precio >= minPrecio && producto.precio <= maxPrecio
      );
    }

    // Filtrar por momento del día
    if (filters.momentoDelDia) {
      productos = productos.filter(producto => 
        producto.momentosRecomendados.includes(filters.momentoDelDia!)
      );
    }

    // Filtrar por etiqueta
    if (filters.etiqueta) {
      const etiquetaLower = filters.etiqueta.toLowerCase();
      productos = productos.filter(producto => 
        producto.etiquetas.some(etiqueta => 
          etiqueta.toLowerCase().includes(etiquetaLower)
        )
      );
    }

    // Filtrar por nombre si se proporciona (búsqueda parcial)
    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      productos = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(nombreLower)
      );
    }

    // Ordenar alfabéticamente por nombre
    productos.sort((a, b) => a.compareByNombre(b));

    // ✅ USAR MAPPER PARA CONVERTIR A OBJETOS PLANOS
    const productosResponse = productos.map(producto => ProductoMapper.toResponse(producto));

    console.log('Productos response:', JSON.stringify(productosResponse, null, 2));

    return {
      productos: productosResponse, // ✅ RETORNAR OBJETOS PLANOS
      total: productosResponse.length
    };
  }
}