import { PrismaClient } from '@prisma/client';
import { CategoriaRepository } from '../../domain/repositories/categoria.repository';
import { Categoria, TipoProducto } from '../../domain/models/categoria.model';
import { CategoriaMapper } from '../mappers/categoria.mapper';

export class PrismaCategoriaRepository implements CategoriaRepository {
  private readonly prisma = new PrismaClient();

  async save(categoria: Categoria): Promise<Categoria> {
    const categoriaData = CategoriaMapper.toPrisma(categoria);
    
    const savedCategoria = await this.prisma.categoria.create({
      data: categoriaData
    });

    return CategoriaMapper.toDomain(savedCategoria);
  }

  async update(categoria: Categoria): Promise<Categoria> {
    const categoriaData = CategoriaMapper.toPrisma(categoria);
    
    const updatedCategoria = await this.prisma.categoria.update({
      where: { id: categoria.id },
      data: {
        nombre: categoriaData.nombre,
        descripcion: categoriaData.descripcion,
        tipoProducto: categoriaData.tipoProducto,
        //fechaActualizacion: categoriaData.fechaActualizacion
      }
    });

    return CategoriaMapper.toDomain(updatedCategoria);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.categoria.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Categoria | null> {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id }
    });

    return categoria ? CategoriaMapper.toDomain(categoria) : null;
  }

  async findByIds(ids: string[]): Promise<Categoria[]> {
    const categorias = await this.prisma.categoria.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return CategoriaMapper.toDomainList(categorias);
  }

  async findMany(): Promise<Categoria[]> {
    const categorias = await this.prisma.categoria.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });

    return CategoriaMapper.toDomainList(categorias);
  }

  async findByNombre(nombre: string): Promise<Categoria | null> {
    const categoria = await this.prisma.categoria.findUnique({
      where: { nombre }
    });

    return categoria ? CategoriaMapper.toDomain(categoria) : null;
  }

  async findByTipoProducto(tipoProducto: TipoProducto): Promise<Categoria[]> {
    const categorias = await this.prisma.categoria.findMany({
      where: { tipoProducto },
      orderBy: {
        nombre: 'asc'
      }
    });

    return CategoriaMapper.toDomainList(categorias);
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const count = await this.prisma.categoria.count({
      where: { nombre }
    });

    return count > 0;
  }
}