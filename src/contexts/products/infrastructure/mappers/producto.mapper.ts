import { 
    Producto as PrismaProducto, 
    MomentoDelDia as PrismaMomentoDelDia,
    Categoria as PrismaCategoria,
    Sabor as PrismaSabor,
    Tamano as PrismaTamano
  } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Producto, PrimitiveProducto, MomentoDelDia } from '../../domain/models/producto.model';
  
  type PrismaProductoWithRelations = PrismaProducto & {
    categoria?: PrismaCategoria | null;
    sabor?: PrismaSabor | null;
    tamano?: PrismaTamano | null;
  };
  
  export class ProductoMapper {
    static toDomain(prismaProducto: PrismaProductoWithRelations): Producto {
      const primitiveProducto: PrimitiveProducto = {
        id: prismaProducto.id,
        nombre: prismaProducto.nombre,
        descripcion: prismaProducto.descripcion,
        precio: ProductoMapper.decimalToNumber(prismaProducto.precio),
        // Información nutricional
        proteina: prismaProducto.proteina,
        calorias: prismaProducto.calorias,
        volumen: prismaProducto.volumen,
        carbohidratos: prismaProducto.carbohidratos,
        grasas: prismaProducto.grasas,
        fibra: prismaProducto.fibra,
        azucar: prismaProducto.azucar,
        // Relaciones FK
        categoriaId: prismaProducto.categoriaId,
        saborId: prismaProducto.saborId,
        tamanoId: prismaProducto.tamanoId,
        // Información adicional
        urlImagen: prismaProducto.urlImagen,
        ingredientes: [...prismaProducto.ingredientes],
        etiquetas: [...prismaProducto.etiquetas],
        momentosRecomendados: prismaProducto.momentosRecomendados.map(ProductoMapper.mapPrismaMomentoToDomain),
        // Timestamps
        fechaCreacion: prismaProducto.fechaCreacion,
        fechaActualizacion: prismaProducto.fechaActualizacion
      };
  
      return Producto.fromPrimitives(primitiveProducto);
    }
  
    static toPrisma(producto: Producto): Omit<PrismaProducto, 'fechaCreacion' | 'fechaActualizacion'> {
      const primitives = producto.toPrimitives();
      
      return {
        id: primitives.id,
        nombre: primitives.nombre,
        descripcion: primitives.descripcion,
        precio: new Decimal(primitives.precio),
        // Información nutricional
        proteina: primitives.proteina,
        calorias: primitives.calorias,
        volumen: primitives.volumen,
        carbohidratos: primitives.carbohidratos,
        grasas: primitives.grasas,
        fibra: primitives.fibra,
        azucar: primitives.azucar,
        // Relaciones FK
        categoriaId: primitives.categoriaId,
        saborId: primitives.saborId,
        tamanoId: primitives.tamanoId,
        // Información adicional
        urlImagen: primitives.urlImagen,
        ingredientes: [...primitives.ingredientes],
        etiquetas: [...primitives.etiquetas],
        momentosRecomendados: primitives.momentosRecomendados.map(ProductoMapper.mapDomainMomentoToPrisma)
      };
    }
  
    static toDomainList(prismaProductos: PrismaProductoWithRelations[]): Producto[] {
      return prismaProductos.map(ProductoMapper.toDomain);
    }
  
    static toResponse(producto: Producto, includeRelations: any = {}) {
      return {
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
        // Relaciones FK
        categoriaId: producto.categoriaId,
        saborId: producto.saborId,
        tamanoId: producto.tamanoId,
        // Información adicional
        urlImagen: producto.urlImagen,
        ingredientes: producto.ingredientes,
        etiquetas: producto.etiquetas,
        momentosRecomendados: producto.momentosRecomendados,
        // Timestamps
        fechaCreacion: producto.fechaCreacion,
        fechaActualizacion: producto.fechaActualizacion,
        // Campos adicionales para el frontend
        tieneDescripcion: producto.hasDescripcion(),
        tieneImagen: producto.hasImagen(),
        tieneIngredientes: producto.hasIngredientes(),
        tieneEtiquetas: producto.hasEtiquetas(),
        tieneMomentosRecomendados: producto.hasMomentosRecomendados(),
        tieneInfoNutricional: producto.hasInfoNutricional(),
        esProductoCompleto: producto.isCompleteProduct(),
        // Relaciones incluidas
        ...includeRelations
      };
    }
  
    private static decimalToNumber(decimal: Decimal): number {
      return parseFloat(decimal.toString());
    }
  
    private static mapPrismaMomentoToDomain(prismaMomento: PrismaMomentoDelDia): MomentoDelDia {
      switch (prismaMomento) {
        case PrismaMomentoDelDia.MANANA:
          return MomentoDelDia.MANANA;
        case PrismaMomentoDelDia.PRE_ENTRENAMIENTO:
          return MomentoDelDia.PRE_ENTRENAMIENTO;
        case PrismaMomentoDelDia.POST_ENTRENAMIENTO:
          return MomentoDelDia.POST_ENTRENAMIENTO;
        case PrismaMomentoDelDia.TARDE:
          return MomentoDelDia.TARDE;
        case PrismaMomentoDelDia.NOCHE:
          return MomentoDelDia.NOCHE;
        case PrismaMomentoDelDia.ANTES_DORMIR:
          return MomentoDelDia.ANTES_DORMIR;
        default:
          throw new Error(`Momento del día no válido: ${prismaMomento}`);
      }
    }
  
    private static mapDomainMomentoToPrisma(domainMomento: MomentoDelDia): PrismaMomentoDelDia {
      switch (domainMomento) {
        case MomentoDelDia.MANANA:
          return PrismaMomentoDelDia.MANANA;
        case MomentoDelDia.PRE_ENTRENAMIENTO:
          return PrismaMomentoDelDia.PRE_ENTRENAMIENTO;
        case MomentoDelDia.POST_ENTRENAMIENTO:
          return PrismaMomentoDelDia.POST_ENTRENAMIENTO;
        case MomentoDelDia.TARDE:
          return PrismaMomentoDelDia.TARDE;
        case MomentoDelDia.NOCHE:
          return PrismaMomentoDelDia.NOCHE;
        case MomentoDelDia.ANTES_DORMIR:
          return PrismaMomentoDelDia.ANTES_DORMIR;
        default:
          throw new Error(`Momento del día no válido: ${domainMomento}`);
      }
    }
  }