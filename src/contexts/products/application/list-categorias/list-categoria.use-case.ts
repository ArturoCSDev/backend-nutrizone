import { CategoriaRepository } from '../../domain/repositories/categoria.repository';
import { Categoria, TipoProducto } from '../../domain/models/categoria.model';
import { ListCategoriaDto } from './list-categoria.dto';

export interface ListCategoriaResponse {
  categorias: Categoria[];
  total: number;
}

export class ListCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async execute(filters: ListCategoriaDto): Promise<ListCategoriaResponse> {
    let categorias: Categoria[];

    // Si hay filtro por tipo de producto, filtrar por ese criterio
    if (filters.tipoProducto) {
      categorias = await this.categoriaRepository.findByTipoProducto(filters.tipoProducto);
    } else {
      // Si no hay filtros específicos, traer todas las categorías
      categorias = await this.categoriaRepository.findMany();
    }

    // Filtrar por nombre si se proporciona (búsqueda local ya que no hay método específico en el repositorio)
    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      categorias = categorias.filter(categoria => 
        categoria.nombre.toLowerCase().includes(nombreLower)
      );
    }

    return {
      categorias,
      total: categorias.length
    };
  }
}