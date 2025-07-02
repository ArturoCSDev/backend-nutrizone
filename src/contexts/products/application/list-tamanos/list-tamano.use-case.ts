import { TamanoRepository } from '../../domain/repositories/tamano.repository';
import { Tamano } from '../../domain/models/tamano.model';
import { ListTamanoDto } from './list-tamano.dto';
import { TamanoMapper } from '../../infrastructure/mappers/tamano.mapper'; // ✅ IMPORTAR MAPPER

export interface ListTamanoResponse {
  tamanos: ReturnType<typeof TamanoMapper.toResponse>[]; // ✅ USAR TIPO DEL MAPPER
  total: number;
}

export class ListTamanoUseCase {
  constructor(private readonly tamanoRepository: TamanoRepository) {}

  async execute(filters: ListTamanoDto): Promise<ListTamanoResponse> {
    let tamanos: Tamano[];

    tamanos = await this.tamanoRepository.findMany();

    if (filters.volumenMinimo !== undefined || filters.volumenMaximo !== undefined) {
      const minVolumen = filters.volumenMinimo ?? 0;
      const maxVolumen = filters.volumenMaximo ?? Number.MAX_SAFE_INTEGER;
      
      tamanos = tamanos.filter(tamano => 
        tamano.volumen >= minVolumen && tamano.volumen <= maxVolumen
      );
    }

    if (filters.proteinaMinima !== undefined) {
      tamanos = tamanos.filter(tamano => 
        tamano.proteina >= filters.proteinaMinima!
      );
    }

    if (filters.nombre) {
      const nombreLower = filters.nombre.toLowerCase();
      tamanos = tamanos.filter(tamano => 
        tamano.nombre.toLowerCase().includes(nombreLower)
      );
    }

    tamanos.sort((a, b) => a.comparePorVolumen(b));

    // ✅ USAR MAPPER
    const tamanosResponse = tamanos.map(tamano => TamanoMapper.toResponse(tamano));

    return {
      tamanos: tamanosResponse, // ✅ RETORNAR OBJETOS PLANOS
      total: tamanosResponse.length
    };
  }
}