import { TamanoRepository } from '../../domain/repositories/tamano.repository';
import { Tamano } from '../../domain/models/tamano.model';
import { ListTamanoDto } from './list-tamano.dto';

export interface ListTamanoResponse {
  tamanos: Tamano[];
  total: number;
}

export class ListTamanoUseCase {
  constructor(private readonly tamanoRepository: TamanoRepository) {}

  async execute(filters: ListTamanoDto): Promise<ListTamanoResponse> {
    let tamanos: Tamano[];

    // Comenzar con todos los tamaños
    tamanos = await this.tamanoRepository.findMany();

    // Aplicar filtros según los criterios proporcionados
    if (filters.volumenMinimo !== undefined || filters.volumenMaximo !== undefined) {
      const minVolumen = filters.volumenMinimo ?? 0;
      const maxVolumen = filters.volumenMaximo ?? Number.MAX_SAFE_INTEGER;
      
      tamanos = tamanos.filter(tamano => 
        tamano.volumen >= minVolumen && tamano.volumen <= maxVolumen
      );
    }

    // Filtrar por proteína mínima
    if (filters.proteinaMinima !== undefined) {
      tamanos = tamanos.filter(tamano => 
        tamano.proteina >= filters.proteinaMinima!
      );
    }

    // Filtrar por nombre si se proporciona (búsqueda parcial)
    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      tamanos = tamanos.filter(tamano => 
        tamano.nombre.toLowerCase().includes(nombreLower)
      );
    }

    // Ordenar por volumen (menor a mayor)
    tamanos.sort((a, b) => a.comparePorVolumen(b));

    return {
      tamanos,
      total: tamanos.length
    };
  }
}