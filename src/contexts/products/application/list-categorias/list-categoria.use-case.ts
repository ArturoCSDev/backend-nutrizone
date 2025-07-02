import { CategoriaRepository } from '../../domain/repositories/categoria.repository';
import { Categoria, TipoProducto } from '../../domain/models/categoria.model';
import { ListCategoriaDto } from './list-categoria.dto';
import { CategoriaMapper } from '../../infrastructure/mappers/categoria.mapper'; // ✅ IMPORTAR MAPPER

export interface ListCategoriaResponse {
  categorias: ReturnType<typeof CategoriaMapper.toResponse>[]; // ✅ USAR TIPO DEL MAPPER
  total: number;
}

export class ListCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async execute(filters: ListCategoriaDto): Promise<ListCategoriaResponse> {
    let categorias: Categoria[];

    if (filters.tipoProducto) {
      categorias = await this.categoriaRepository.findByTipoProducto(filters.tipoProducto);
    } else {
      categorias = await this.categoriaRepository.findMany();
    }

    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      categorias = categorias.filter(categoria => 
        categoria.nombre.toLowerCase().includes(nombreLower)
      );
    }

    // ✅ USAR MAPPER
    const categoriasResponse = categorias.map(categoria => CategoriaMapper.toResponse(categoria));

    return {
      categorias: categoriasResponse, // ✅ RETORNAR OBJETOS PLANOS
      total: categoriasResponse.length
    };
  }
}