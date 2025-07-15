import { ProductoRepository } from '../../domain/repositories/producto.repository';
import { Producto, MomentoDelDia } from '../../domain/models/producto.model';
import { PreferenciaCliente } from '../../../client/domain/models/preferencia-cliente.model';

export interface ProductSearchFilters {
  momentoDelDia?: MomentoDelDia;
  soloFavoritos?: boolean;
  excludeAlergenos?: string[];
  precioMaximo?: number;
  categorias?: string[];
  objetivoNutricional?: string;
}

export interface ProductSearchResult {
  productos: Producto[];
  filtrosAplicados: string[];
  totalEncontrados: number;
  recomendacionesAdicionales?: string[];
}

export class ProductSearchService {
  constructor(
    private readonly productoRepository: ProductoRepository
  ) {}

  async searchRecommendedProducts(
    preferencias: PreferenciaCliente,
    filters: ProductSearchFilters
  ): Promise<ProductSearchResult> {
    let productos = await this.productoRepository.findMany();
    const filtrosAplicados: string[] = [];

    // 1. Filtrar por momento del día
    if (filters.momentoDelDia) {
      productos = productos.filter(p => 
        p.momentosRecomendados.includes(filters.momentoDelDia!)
      );
      filtrosAplicados.push(`Momento: ${filters.momentoDelDia}`);
    }

    // 2. Filtrar solo favoritos si se solicita
    if (filters.soloFavoritos && preferencias.productosFavoritos.length > 0) {
      productos = productos.filter(p => 
        preferencias.productosFavoritos.includes(p.id)
      );
      filtrosAplicados.push('Solo productos favoritos');
    }

    // 3. Excluir alergenos
    if (preferencias.alergenos.length > 0) {
      productos = productos.filter(p => 
        preferencias.isAllergenFree(p.ingredientes)
      );
      filtrosAplicados.push(`Excluidos alergenos: ${preferencias.alergenos.join(', ')}`);
    }

    // 4. Filtrar por precio máximo
    if (filters.precioMaximo) {
      productos = productos.filter(p => p.precio <= filters.precioMaximo!);
      filtrosAplicados.push(`Precio máximo: S/. ${filters.precioMaximo}`);
    }

    // 5. Priorizar productos favoritos (pero no excluir otros)
    if (!filters.soloFavoritos) {
      productos.sort((a, b) => {
        const aEsFavorito = preferencias.productosFavoritos.includes(a.id);
        const bEsFavorito = preferencias.productosFavoritos.includes(b.id);
        
        if (aEsFavorito && !bEsFavorito) return -1;
        if (!aEsFavorito && bEsFavorito) return 1;
        return 0;
      });
    }

    return {
      productos: productos.slice(0, 10), // Top 10 productos
      filtrosAplicados,
      totalEncontrados: productos.length,
      recomendacionesAdicionales: this.generateAdditionalRecommendations(productos, preferencias)
    };
  }

  private generateAdditionalRecommendations(productos: Producto[], preferencias: PreferenciaCliente): string[] {
    const recomendaciones: string[] = [];

    // Analizar patrones en productos encontrados
    const categorias = productos.map(p => p.categoriaId).filter(Boolean);
    const categoriaMasComun = this.getMostCommon(categorias);

    if (categoriaMasComun) {
      recomendaciones.push(`Productos de ${categoriaMasComun} son ideales para tus objetivos`);
    }

    // Recomendar momentos del día
    if (preferencias.hasTrainingSchedule()) {
      recomendaciones.push('Considera productos pre y post-entrenamiento para tus días de entreno');
    }

    return recomendaciones;
  }

  private getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    const counts = arr.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T;
  }
}