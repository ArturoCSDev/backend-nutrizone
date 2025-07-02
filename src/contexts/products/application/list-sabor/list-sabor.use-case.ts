// src/features/products/application/use-cases/list-sabor.use-case.ts
import { SaborRepository } from '../../domain/repositories/sabor.repository';
import { Sabor } from '../../domain/models/sabor.model';
import { ListSaborDto } from './list-sabor.dto';
import { SaborMapper } from '../../infrastructure/mappers/sabor.mapper'; // ✅ IMPORTAR EL MAPPER

export interface ListSaborResponse {
  sabores: ReturnType<typeof SaborMapper.toResponse>[]; // ✅ USAR EL TIPO DEL MAPPER
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

    // ✅ USAR EL MAPPER QUE YA TIENES
    const saboresResponse = sabores.map(sabor => SaborMapper.toResponse(sabor));

    console.log('Sabores response:', saboresResponse);
    
    return {
      sabores: saboresResponse,
      total: saboresResponse.length
    };
  }
}