import { PrismaClient } from '@prisma/client';
import { ProductoRepository } from '../../domain/repositories/producto.repository';
import { Producto, MomentoDelDia } from '../../domain/models/producto.model';
import { ProductoMapper } from '../mappers/producto.mapper';

export class PrismaProductoRepository implements ProductoRepository {
  private readonly prisma = new PrismaClient();

  async save(producto: Producto): Promise<Producto> {
    const productoData = ProductoMapper.toPrisma(producto);
    
    const savedProducto = await this.prisma.producto.create({
      data: productoData,
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      }
    });

    return ProductoMapper.toDomain(savedProducto);
  }

  async update(producto: Producto): Promise<Producto> {
    const productoData = ProductoMapper.toPrisma(producto);
    
    const updatedProducto = await this.prisma.producto.update({
      where: { id: producto.id },
      data: {
        nombre: productoData.nombre,
        descripcion: productoData.descripcion,
        precio: productoData.precio,
        proteina: productoData.proteina,
        calorias: productoData.calorias,
        volumen: productoData.volumen,
        carbohidratos: productoData.carbohidratos,
        grasas: productoData.grasas,
        fibra: productoData.fibra,
        azucar: productoData.azucar,
        categoriaId: productoData.categoriaId,
        saborId: productoData.saborId,
        tamanoId: productoData.tamanoId,
        urlImagen: productoData.urlImagen,
        ingredientes: productoData.ingredientes,
        etiquetas: productoData.etiquetas,
        momentosRecomendados: productoData.momentosRecomendados,
        //fechaActualizacion: productoData.fechaActualizacion
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      }
    });

    return ProductoMapper.toDomain(updatedProducto);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.producto.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Producto | null> {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      }
    });

    return producto ? ProductoMapper.toDomain(producto) : null;
  }

  async findByIds(ids: string[]): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        id: {
          in: ids
        }
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findMany(): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findByNombre(nombre: string): Promise<Producto | null> {
    const producto = await this.prisma.producto.findFirst({
      where: { nombre },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      }
    });

    return producto ? ProductoMapper.toDomain(producto) : null;
  }

  async findByNombreContains(nombre: string): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        }
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findByCategoriaId(categoriaId: string): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: { categoriaId },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findBySaborId(saborId: string): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: { saborId },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findByTamanoId(tamanoId: string): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: { tamanoId },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findByPrecioRange(minPrecio: number, maxPrecio: number): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        precio: {
          gte: minPrecio,
          lte: maxPrecio
        }
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        precio: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findByMomentoRecomendado(momento: MomentoDelDia): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        momentosRecomendados: {
          has: momento
        }
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findWithIngredientes(): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        ingredientes: {
          isEmpty: false
        }
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async findWithEtiquetas(): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        etiquetas: {
          isEmpty: false
        }
      },
      include: {
        categoria: true,
        sabor: true,
        tamano: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return ProductoMapper.toDomainList(productos);
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const count = await this.prisma.producto.count({
      where: { nombre }
    });

    return count > 0;
  }

  async existsByNombreExcludingId(nombre: string, excludeId: string): Promise<boolean> {
    const count = await this.prisma.producto.count({
      where: {
        nombre,
        id: {
          not: excludeId
        }
      }
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return await this.prisma.producto.count();
  }
}