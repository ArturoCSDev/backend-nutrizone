import { SaborRepository } from '../../domain/repositories/sabor.repository';
import { Sabor } from '../../domain/models/sabor.model';
import { ListSaborDto } from './list-sabor.dto';

export interface ListSaborResponse {
  sabores: Sabor[];
  total: number;
}

export class ListSaborUseCase {
  constructor(private readonly saborRepository: SaborRepository) {}

  async execute(filters: ListSaborDto): Promise<ListSaborResponse> {
    let sabores: Sabor[];

    // Aplicar filtro de descripción si se especifica
    if (filters.conDescripcion === true) {
      sabores = await this.saborRepository.findWithDescripcion();
    } else if (filters.conDescripcion === false) {
      sabores = await this.saborRepository.findWithoutDescripcion();
    } else {
      // Si no hay filtro específico, traer todos
      sabores = await this.saborRepository.findMany();
    }

    // Filtrar por nombre si se proporciona (búsqueda parcial)
    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      sabores = sabores.filter(sabor => 
        sabor.nombre.toLowerCase().includes(nombreLower)
      );
    }

    // Ordenar alfabéticamente por nombre
    sabores.sort((a, b) => a.compareByNombre(b));

    return {
      sabores,
      total: sabores.length
    };
  }
}