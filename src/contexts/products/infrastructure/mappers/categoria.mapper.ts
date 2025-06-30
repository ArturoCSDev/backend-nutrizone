import { Categoria as PrismaCategoria, TipoProducto as PrismaTipoProducto } from '@prisma/client';
import { Categoria, TipoProducto, PrimitiveCategoria } from '../../domain/models/categoria.model';

export class CategoriaMapper {
  static toDomain(prismaCategoria: PrismaCategoria): Categoria {
    const primitiveCategoria: PrimitiveCategoria = {
      id: prismaCategoria.id,
      nombre: prismaCategoria.nombre,
      descripcion: prismaCategoria.descripcion,
      tipoProducto: CategoriaMapper.mapPrismaTipoProductoToDomain(prismaCategoria.tipoProducto),
      fechaCreacion: prismaCategoria.fechaCreacion,
      fechaActualizacion: prismaCategoria.fechaActualizacion
    };

    return Categoria.fromPrimitives(primitiveCategoria);
  }

  static toPrisma(categoria: Categoria): Omit<PrismaCategoria, 'fechaCreacion' | 'fechaActualizacion'> {
    const primitives = categoria.toPrimitives();
    
    return {
      id: primitives.id,
      nombre: primitives.nombre,
      descripcion: primitives.descripcion,
      tipoProducto: CategoriaMapper.mapDomainTipoProductoToPrisma(primitives.tipoProducto)
    };
  }

  static toDomainList(prismaCategorias: PrismaCategoria[]): Categoria[] {
    return prismaCategorias.map(CategoriaMapper.toDomain);
  }

  static toResponse(categoria: Categoria) {
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      tipoProducto: categoria.tipoProducto,
      fechaCreacion: categoria.fechaCreacion,
      fechaActualizacion: categoria.fechaActualizacion,
      // Campos adicionales para el frontend
      esBatido: categoria.isBatido(),
      esRefresco: categoria.isRefresco(),
      esWaffle: categoria.isWaffle(),
      tieneDescripcion: categoria.hasDescripcion()
    };
  }

  private static mapPrismaTipoProductoToDomain(prismaTipo: PrismaTipoProducto): TipoProducto {
    switch (prismaTipo) {
      case PrismaTipoProducto.BATIDO:
        return TipoProducto.BATIDO;
      case PrismaTipoProducto.REFRESCO:
        return TipoProducto.REFRESCO;
      case PrismaTipoProducto.WAFFLE:
        return TipoProducto.WAFFLE;
      default:
        throw new Error(`Tipo de producto no válido: ${prismaTipo}`);
    }
  }

  private static mapDomainTipoProductoToPrisma(domainTipo: TipoProducto): PrismaTipoProducto {
    switch (domainTipo) {
      case TipoProducto.BATIDO:
        return PrismaTipoProducto.BATIDO;
      case TipoProducto.REFRESCO:
        return PrismaTipoProducto.REFRESCO;
      case TipoProducto.WAFFLE:
        return PrismaTipoProducto.WAFFLE;
      default:
        throw new Error(`Tipo de producto no válido: ${domainTipo}`);
    }
  }
}