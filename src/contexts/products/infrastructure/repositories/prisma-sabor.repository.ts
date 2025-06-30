import { PrismaClient } from '@prisma/client';
import { SaborRepository } from '../../domain/repositories/sabor.repository';
import { Sabor } from '../../domain/models/sabor.model';
import { SaborMapper } from '../mappers/sabor.mapper';

export class PrismaSaborRepository implements SaborRepository {
  private readonly prisma = new PrismaClient();

  async save(sabor: Sabor): Promise<Sabor> {
    const saborData = SaborMapper.toPrisma(sabor);
    
    const savedSabor = await this.prisma.sabor.create({
      data: saborData
    });

    return SaborMapper.toDomain(savedSabor);
  }

  async update(sabor: Sabor): Promise<Sabor> {
    const saborData = SaborMapper.toPrisma(sabor);
    
    const updatedSabor = await this.prisma.sabor.update({
      where: { id: sabor.id },
      data: {
        nombre: saborData.nombre,
        descripcion: saborData.descripcion,
        //fechaActualizacion: saborData.fechaActualizacion
      }
    });

    return SaborMapper.toDomain(updatedSabor);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sabor.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Sabor | null> {
    const sabor = await this.prisma.sabor.findUnique({
      where: { id }
    });

    return sabor ? SaborMapper.toDomain(sabor) : null;
  }

  async findByIds(ids: string[]): Promise<Sabor[]> {
    const sabores = await this.prisma.sabor.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return SaborMapper.toDomainList(sabores);
  }

  async findMany(): Promise<Sabor[]> {
    const sabores = await this.prisma.sabor.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });

    return SaborMapper.toDomainList(sabores);
  }

  async findByNombre(nombre: string): Promise<Sabor | null> {
    const sabor = await this.prisma.sabor.findUnique({
      where: { nombre }
    });

    return sabor ? SaborMapper.toDomain(sabor) : null;
  }

  async findByNombreContains(nombre: string): Promise<Sabor[]> {
    const sabores = await this.prisma.sabor.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive'
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return SaborMapper.toDomainList(sabores);
  }

  async findWithDescripcion(): Promise<Sabor[]> {
    const sabores = await this.prisma.sabor.findMany({
      where: {
        descripcion: {
          not: null
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return SaborMapper.toDomainList(sabores);
  }

  async findWithoutDescripcion(): Promise<Sabor[]> {
    const sabores = await this.prisma.sabor.findMany({
      where: {
        descripcion: null
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return SaborMapper.toDomainList(sabores);
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const count = await this.prisma.sabor.count({
      where: { nombre }
    });

    return count > 0;
  }

  async existsByNombreExcludingId(nombre: string, excludeId: string): Promise<boolean> {
    const count = await this.prisma.sabor.count({
      where: {
        nombre,
        id: {
          not: excludeId
        }
      }
    });

    return count > 0;
  }
}