import { ProductoRepository } from '../../domain/repositories/producto.repository';
import { CategoriaRepository } from '../../domain/repositories/categoria.repository';
import { SaborRepository } from '../../domain/repositories/sabor.repository';
import { TamanoRepository } from '../../domain/repositories/tamano.repository';
import { PreferenciaClienteRepository } from '../../../client/domain/repositories/preferencia-cliente.repository';
import { MomentoDelDia, Producto } from '../../domain/models/producto.model';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';
import { AdvancedProductSearchDto, AdvancedProductSearchResponse, EstadisticasBusqueda, FiltrosDisponibles, ProductoAvanzadoDto } from './advanced-product-search.dto';

export class AdvancedProductSearchUseCase {
  constructor(
    private readonly productoRepository: ProductoRepository,
    private readonly categoriaRepository: CategoriaRepository,
    private readonly saborRepository: SaborRepository,
    private readonly tamanoRepository: TamanoRepository,
    private readonly preferenciaClienteRepository: PreferenciaClienteRepository
  ) {}

  async execute(dto: AdvancedProductSearchDto): Promise<AdvancedProductSearchResponse> {
    logger.info('Iniciando búsqueda avanzada de productos', { 
      filtros: this.summarizeFilters(dto)
    });

    // 1. Obtener todos los productos inicialmente
    let productos = await this.productoRepository.findMany();
    const totalInicial = productos.length;

    // 2. Aplicar filtros
    productos = await this.applyFilters(productos, dto);

    // 3. Obtener preferencias del cliente si aplica
    let preferenciasCliente = null;
    if (dto.clienteId) {
      preferenciasCliente = await this.preferenciaClienteRepository.findByClienteId(dto.clienteId);
    }

    // 4. Aplicar filtros específicos del cliente
    if (preferenciasCliente) {
      productos = this.applyClientFilters(productos, dto, preferenciasCliente);
    }

    // 5. Aplicar ordenamiento
    productos = this.applySorting(productos, dto);

    // 6. Calcular paginación
    const total = productos.length;
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    // 7. Aplicar paginación
    const productosPaginados = productos.slice(offset, offset + limit);

    // 8. Obtener relaciones si se solicitan
    const relaciones = await this.loadRelations(productosPaginados, dto);

    // 9. Mapear a DTOs
    const productosDto = await this.mapToAdvancedDto(
      productosPaginados, 
      dto, 
      relaciones, 
      preferenciasCliente
    );

    // 10. Obtener filtros disponibles y estadísticas
    const filtrosDisponibles = await this.getFiltrosDisponibles();
    const estadisticas = dto.includeEstadisticas ? 
      this.calculateEstadisticas(productos) : undefined;

    const response = {
      productos: productosDto,
      pagination: {
        total,
        totalPages,
        currentPage,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
        limit,
        offset
      },
      filtros: {
        aplicados: this.getAppliedFilters(dto),
        disponibles: filtrosDisponibles
      },
      estadisticas
    };

    logger.success('Búsqueda avanzada completada', {
      totalInicial,
      totalFiltrado: total,
      productosRetornados: productosDto.length,
      filtrosAplicados: response.filtros.aplicados.length
    });

    return response;
  }

  private async applyFilters(productos: Producto[], dto: AdvancedProductSearchDto): Promise<Producto[]> {
    let filteredProducts = productos;

    // Filtro de búsqueda por texto
    if (dto.search) {
      const searchTerm = dto.search.toLowerCase();
      filteredProducts = filteredProducts.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm) ||
        producto.descripcion?.toLowerCase().includes(searchTerm) ||
        producto.ingredientes.some(ing => ing.toLowerCase().includes(searchTerm))
      );
    }

    // Filtros de categorización
    if (dto.categoriaIds?.length) {
      filteredProducts = filteredProducts.filter(p => 
        p.categoriaId && dto.categoriaIds!.includes(p.categoriaId)
      );
    }

    if (dto.saborIds?.length) {
      filteredProducts = filteredProducts.filter(p => 
        p.saborId && dto.saborIds!.includes(p.saborId)
      );
    }

    if (dto.tamanoIds?.length) {
      filteredProducts = filteredProducts.filter(p => 
        p.tamanoId && dto.tamanoIds!.includes(p.tamanoId)
      );
    }

    // Filtros de precio
    if (dto.precioMin !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.precio >= dto.precioMin!);
    }

    if (dto.precioMax !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.precio <= dto.precioMax!);
    }

    // Filtros nutricionales
    if (dto.proteinaMin !== undefined) {
      filteredProducts = filteredProducts.filter(p => 
        p.proteina !== null && p.proteina >= dto.proteinaMin!
      );
    }

    if (dto.caloriasMin !== undefined) {
      filteredProducts = filteredProducts.filter(p => 
        p.calorias !== null && p.calorias >= dto.caloriasMin!
      );
    }

    if (dto.caloriasMax !== undefined) {
      filteredProducts = filteredProducts.filter(p => 
        p.calorias !== null && p.calorias <= dto.caloriasMax!
      );
    }

    // Filtros de momento del día
    if (dto.momentosDelDia?.length) {
      filteredProducts = filteredProducts.filter(p => 
        dto.momentosDelDia!.some(momento => p.momentosRecomendados.includes(momento))
      );
    }

    // Filtros de etiquetas
    if (dto.etiquetas?.length) {
      filteredProducts = filteredProducts.filter(p => 
        dto.etiquetas!.some(etiqueta => 
          p.etiquetas.some(pEtiqueta => 
            pEtiqueta.toLowerCase().includes(etiqueta.toLowerCase())
          )
        )
      );
    }

    // Filtros de ingredientes
    if (dto.ingredientes?.length) {
      filteredProducts = filteredProducts.filter(p => 
        dto.ingredientes!.some(ingrediente => 
          p.ingredientes.some(pIngrediente => 
            pIngrediente.toLowerCase().includes(ingrediente.toLowerCase())
          )
        )
      );
    }

    // Excluir alérgenos
    if (dto.excludeAlergenos?.length) {
      filteredProducts = filteredProducts.filter(p => 
        !dto.excludeAlergenos!.some(alergeno => 
          p.ingredientes.some(pIngrediente => 
            pIngrediente.toLowerCase().includes(alergeno.toLowerCase())
          )
        )
      );
    }

    // Filtros de características
    if (dto.soloConImagen) {
      filteredProducts = filteredProducts.filter(p => p.hasImagen());
    }

    if (dto.soloCompletos) {
      filteredProducts = filteredProducts.filter(p => p.isCompleteProduct());
    }

    if (dto.altaProteina) {
      filteredProducts = filteredProducts.filter(p => 
        p.proteina !== null && p.proteina >= 20
      );
    }

    if (dto.bajasCaloria) {
      filteredProducts = filteredProducts.filter(p => 
        p.calorias !== null && p.calorias <= 200
      );
    }

    return filteredProducts;
  }

  private applyClientFilters(
    productos: Producto[], 
    dto: AdvancedProductSearchDto, 
    preferencias: any
  ): Producto[] {
    let filteredProducts = productos;

    // Solo favoritos
    if (dto.soloFavoritos && preferencias.productosFavoritos.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        preferencias.productosFavoritos.includes(p.id)
      );
    }

    // Excluir alérgenos del cliente automáticamente
    if (preferencias.alergenos.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        preferencias.isAllergenFree(p.ingredientes)
      );
    }

    return filteredProducts;
  }

  private applySorting(productos: Producto[], dto: AdvancedProductSearchDto): Producto[] {
    const sortBy = dto.sortBy || 'nombre';
    const sortOrder = dto.sortOrder || 'asc';

    return productos.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'precio':
          comparison = a.precio - b.precio;
          break;
        case 'proteina':
          comparison = (a.proteina || 0) - (b.proteina || 0);
          break;
        case 'calorias':
          comparison = (a.calorias || 0) - (b.calorias || 0);
          break;
        case 'fechaCreacion':
          comparison = a.fechaCreacion.getTime() - b.fechaCreacion.getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private async loadRelations(productos: Producto[], dto: AdvancedProductSearchDto) {
    const relaciones: any = {
      categorias: new Map(),
      sabores: new Map(),
      tamanos: new Map()
    };

    // Cargar categorías
    if (dto.includeCategoria) {
      const categoriaIds = [...new Set(productos.map(p => p.categoriaId).filter(Boolean))];
      if (categoriaIds.length > 0) {
        const categorias = await this.categoriaRepository.findByIds(categoriaIds as string[]);
        categorias.forEach(cat => relaciones.categorias.set(cat.id, cat));
      }
    }

    // Cargar sabores
    if (dto.includeSabor) {
      const saborIds = [...new Set(productos.map(p => p.saborId).filter(Boolean))];
      if (saborIds.length > 0) {
        const sabores = await this.saborRepository.findByIds(saborIds as string[]);
        sabores.forEach(sabor => relaciones.sabores.set(sabor.id, sabor));
      }
    }

    // Cargar tamaños
    if (dto.includeTamano) {
      const tamanoIds = [...new Set(productos.map(p => p.tamanoId).filter(Boolean))];
      if (tamanoIds.length > 0) {
        const tamanos = await this.tamanoRepository.findByIds(tamanoIds as string[]);
        tamanos.forEach(tamano => relaciones.tamanos.set(tamano.id, tamano));
      }
    }

    return relaciones;
  }

  private async mapToAdvancedDto(
    productos: Producto[],
    dto: AdvancedProductSearchDto,
    relaciones: any,
    preferenciasCliente: any
  ): Promise<ProductoAvanzadoDto[]> {
    return productos.map(producto => {
      const productoDto: ProductoAvanzadoDto = {
        // Información básica
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        precioFormateado: producto.getPrecioFormateado(),

        // Información nutricional
        proteina: producto.proteina,
        calorias: producto.calorias,
        volumen: producto.volumen,
        carbohidratos: producto.carbohidratos,
        grasas: producto.grasas,
        fibra: producto.fibra,
        azucar: producto.azucar,

        // Información adicional
        urlImagen: producto.urlImagen,
        ingredientes: producto.ingredientes,
        etiquetas: producto.etiquetas,
        momentosRecomendados: producto.momentosRecomendados,

        // Características calculadas
        tieneDescripcion: producto.hasDescripcion(),
        tieneImagen: producto.hasImagen(),
        tieneIngredientes: producto.hasIngredientes(),
        tieneEtiquetas: producto.hasEtiquetas(),
        tieneMomentosRecomendados: producto.hasMomentosRecomendados(),
        tieneInfoNutricional: producto.hasInfoNutricional(),
        esProductoCompleto: producto.isCompleteProduct(),
        esAltaProteina: producto.proteina !== null && producto.proteina >= 20,
        esBajasCaloria: producto.calorias !== null && producto.calorias <= 200,

        // Timestamps
        fechaCreacion: producto.fechaCreacion.toISOString(),
        fechaActualizacion: producto.fechaActualizacion.toISOString()
      };

      // Agregar relaciones si están disponibles
      if (dto.includeCategoria && producto.categoriaId) {
        const categoria = relaciones.categorias.get(producto.categoriaId);
        if (categoria) {
          productoDto.categoria = {
            id: categoria.id,
            nombre: categoria.nombre,
            tipoProducto: categoria.tipoProducto,
            descripcion: categoria.descripcion
          };
        }
      }

      if (dto.includeSabor && producto.saborId) {
        const sabor = relaciones.sabores.get(producto.saborId);
        if (sabor) {
          productoDto.sabor = {
            id: sabor.id,
            nombre: sabor.nombre,
            descripcion: sabor.descripcion
          };
        }
      }

      if (dto.includeTamano && producto.tamanoId) {
        const tamano = relaciones.tamanos.get(producto.tamanoId);
        if (tamano) {
          productoDto.tamano = {
            id: tamano.id,
            nombre: tamano.nombre,
            volumen: tamano.volumen,
            proteina: tamano.proteina,
            volumenEnLitros: tamano.getVolumenEnLitros(),
            categoria: tamano.isPequeno() ? 'Pequeño' : tamano.isMediano() ? 'Mediano' : 'Grande'
          };
        }
      }

      // Información específica del cliente
      if (preferenciasCliente) {
        productoDto.esFavorito = preferenciasCliente.productosFavoritos.includes(producto.id);
        productoDto.esLibreAlergenos = preferenciasCliente.isAllergenFree(producto.ingredientes);
        
        productoDto.compatibilidadCliente = {
          sinAlergenos: preferenciasCliente.isAllergenFree(producto.ingredientes),
          coincidePreferencias: preferenciasCliente.preferenciasDieteticas.some((pref: string) =>
            producto.etiquetas.some(etiqueta => 
              etiqueta.toLowerCase().includes(pref.toLowerCase())
            )
          ),
          recomendadoParaObjetivo: producto.momentosRecomendados.length > 0
        };
      }

      return productoDto;
    });
  }

  private async getFiltrosDisponibles(): Promise<FiltrosDisponibles> {
    // Obtener todas las categorías, sabores y tamaños con counts
    const [categorias, sabores, tamanos, productos] = await Promise.all([
      this.categoriaRepository.findMany(),
      this.saborRepository.findMany(),
      this.tamanoRepository.findMany(),
      this.productoRepository.findMany()
    ]);

    // Calcular rangos
    const precios = productos.map(p => p.precio).filter(Boolean);
    const proteinas = productos.map(p => p.proteina).filter(Boolean) as number[];
    const calorias = productos.map(p => p.calorias).filter(Boolean) as number[];

    // Obtener etiquetas y momentos populares
    const todasEtiquetas = productos.flatMap(p => p.etiquetas);
    const todosMomentos = productos.flatMap(p => p.momentosRecomendados);

    const etiquetasCount = this.countOccurrences(todasEtiquetas);
    const momentosCount = this.countOccurrences(todosMomentos);

    return {
      categorias: categorias.map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        tipoProducto: cat.tipoProducto,
        productosCount: productos.filter(p => p.categoriaId === cat.id).length
      })),
      sabores: sabores.map(sabor => ({
        id: sabor.id,
        nombre: sabor.nombre,
        productosCount: productos.filter(p => p.saborId === sabor.id).length
      })),
      tamanos: tamanos.map(tamano => ({
        id: tamano.id,
        nombre: tamano.nombre,
        volumen: tamano.volumen,
        productosCount: productos.filter(p => p.tamanoId === tamano.id).length
      })),
      rangoPrecio: {
        min: Math.min(...precios),
        max: Math.max(...precios)
      },
      rangoProteina: {
        min: proteinas.length ? Math.min(...proteinas) : 0,
        max: proteinas.length ? Math.max(...proteinas) : 0
      },
      rangoCalorias: {
        min: calorias.length ? Math.min(...calorias) : 0,
        max: calorias.length ? Math.max(...calorias) : 0
      },
      etiquetasPopulares: Object.entries(etiquetasCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([etiqueta]) => etiqueta),
      momentosPopulares: Object.entries(momentosCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 6)
        .map(([momento]) => momento) as MomentoDelDia[]
    };
  }

  private calculateEstadisticas(productos: Producto[]): EstadisticasBusqueda {
    const totalProductos = productos.length;
    const productosConImagen = productos.filter(p => p.hasImagen()).length;
    const productosCompletos = productos.filter(p => p.isCompleteProduct()).length;
    const productosAltaProteina = productos.filter(p => p.proteina !== null && p.proteina >= 20).length;
    const productosBajasCaloria = productos.filter(p => p.calorias !== null && p.calorias <= 200).length;

    const precios = productos.map(p => p.precio);
    const proteinas = productos.map(p => p.proteina).filter(Boolean) as number[];
    const calorias = productos.map(p => p.calorias).filter(Boolean) as number[];

    const precioPromedio = precios.length ? precios.reduce((a, b) => a + b, 0) / precios.length : 0;
    const proteinaPromedio = proteinas.length ? proteinas.reduce((a, b) => a + b, 0) / proteinas.length : 0;
    const caloriasPromedio = calorias.length ? calorias.reduce((a, b) => a + b, 0) / calorias.length : 0;

    // Contar categorías y sabores
    const categoriaIds = productos.map(p => p.categoriaId).filter(Boolean);
    const saborIds = productos.map(p => p.saborId).filter(Boolean);
    const todasEtiquetas = productos.flatMap(p => p.etiquetas);

    const categoriasCount = this.countOccurrences(categoriaIds);
    const saboresCount = this.countOccurrences(saborIds);
    const etiquetasCount = this.countOccurrences(todasEtiquetas);

    return {
      totalProductos,
      productosConImagen,
      productosCompletos,
      productosAltaProteina,
      productosBajasCaloria,
      precioPromedio: Number(precioPromedio.toFixed(2)),
      proteinaPromedio: Number(proteinaPromedio.toFixed(1)),
      caloriasPromedio: Number(caloriasPromedio.toFixed(0)),
      categoriasMasPopulares: Object.entries(categoriasCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([id, count]) => ({ nombre: id, count: count as number })),
      saboresMasPopulares: Object.entries(saboresCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([id, count]) => ({ nombre: id, count: count as number })),
      etiquetasComunes: Object.entries(etiquetasCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([etiqueta, count]) => ({ etiqueta, count: count as number }))
    };
  }

  private countOccurrences(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }

  private summarizeFilters(dto: AdvancedProductSearchDto): Record<string, any> {
    const summary: Record<string, any> = {};
    
    if (dto.search) summary.search = dto.search;
    if (dto.categoriaIds?.length) summary.categorias = dto.categoriaIds.length;
    if (dto.saborIds?.length) summary.sabores = dto.saborIds.length;
    if (dto.tamanoIds?.length) summary.tamanos = dto.tamanoIds.length;
    if (dto.precioMin !== undefined) summary.precioMin = dto.precioMin;
    if (dto.precioMax !== undefined) summary.precioMax = dto.precioMax;
    if (dto.proteinaMin !== undefined) summary.proteinaMin = dto.proteinaMin;
    if (dto.clienteId) summary.clienteId = dto.clienteId;
    if (dto.soloFavoritos) summary.soloFavoritos = true;
    if (dto.altaProteina) summary.altaProteina = true;
    if (dto.bajasCaloria) summary.bajasCaloria = true;
    if (dto.sortBy) summary.ordenadoPor = `${dto.sortBy} ${dto.sortOrder || 'asc'}`;
    
    return summary;
  }

  private getAppliedFilters(dto: AdvancedProductSearchDto): string[] {
    const filters: string[] = [];
    
    if (dto.search) filters.push(`Búsqueda: "${dto.search}"`);
    if (dto.categoriaIds?.length) filters.push(`${dto.categoriaIds.length} categoría(s)`);
    if (dto.saborIds?.length) filters.push(`${dto.saborIds.length} sabor(es)`);
    if (dto.tamanoIds?.length) filters.push(`${dto.tamanoIds.length} tamaño(s)`);
    if (dto.tipoProducto) filters.push(`Tipo: ${dto.tipoProducto}`);
    if (dto.precioMin !== undefined || dto.precioMax !== undefined) {
      const min = dto.precioMin || 0;
      const max = dto.precioMax || '∞';
      filters.push(`Precio: S/. ${min} - ${max}`);
    }
    if (dto.proteinaMin !== undefined) filters.push(`Proteína mín: ${dto.proteinaMin}g`);
    if (dto.caloriasMin !== undefined || dto.caloriasMax !== undefined) {
      const min = dto.caloriasMin || 0;
      const max = dto.caloriasMax || '∞';
      filters.push(`Calorías: ${min} - ${max}`);
    }
    if (dto.momentosDelDia?.length) filters.push(`${dto.momentosDelDia.length} momento(s) del día`);
    if (dto.etiquetas?.length) filters.push(`${dto.etiquetas.length} etiqueta(s)`);
    if (dto.ingredientes?.length) filters.push(`${dto.ingredientes.length} ingrediente(s)`);
    if (dto.excludeAlergenos?.length) filters.push(`Excluye ${dto.excludeAlergenos.length} alérgeno(s)`);
    if (dto.soloConImagen) filters.push('Solo con imagen');
    if (dto.soloCompletos) filters.push('Solo productos completos');
    if (dto.altaProteina) filters.push('Alta proteína (≥20g)');
    if (dto.bajasCaloria) filters.push('Bajas calorías (≤200)');
    if (dto.soloFavoritos) filters.push('Solo favoritos');
    if (dto.sortBy) filters.push(`Ordenado por ${dto.sortBy} ${dto.sortOrder || 'asc'}`);
    
    return filters;
  }
}
