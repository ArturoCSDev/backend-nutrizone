import { CategoriaRepository } from '../../domain/repositories/categoria.repository';
import { Categoria } from '../../domain/models/categoria.model';
import { CategoriaResponse, ListCategoriaDto, ListCategoriaResponse } from './list-categoria.dto';

export class ListCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async execute(filters: ListCategoriaDto): Promise<ListCategoriaResponse> {
    let categorias: Categoria[];

    // Obtener categorías según filtros
    if (filters.tipoProducto) {
      categorias = await this.categoriaRepository.findByTipoProducto(filters.tipoProducto);
    } else {
      categorias = await this.categoriaRepository.findMany();
    }

    // Filtrar por nombre si se proporciona
    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      categorias = categorias.filter(categoria => 
        categoria.nombre.toLowerCase().includes(nombreLower)
      );
    }

    // Transformar a respuesta usando método nativo de la entidad
    const categoriasResponse: CategoriaResponse[] = categorias.map(categoria => ({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      tipoProducto: categoria.tipoProducto,
      fechaCreacion: categoria.fechaCreacion.toISOString(),
      fechaActualizacion: categoria.fechaActualizacion.toISOString()
    }));

    return {
      categorias: categoriasResponse,
      total: categoriasResponse.length
    };
  }
}