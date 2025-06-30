import { PrismaClient } from '@prisma/client';
import { TamanoRepository } from '../../domain/repositories/tamano.repository';
import { Tamano } from '../../domain/models/tamano.model';
import { TamanoMapper } from '../mappers/tamano.mapper';

export class PrismaTamanoRepository implements TamanoRepository {
  private readonly prisma = new PrismaClient();

  async save(tamano: Tamano): Promise<Tamano> {
    const tamanoData = TamanoMapper.toPrisma(tamano);
    
    const savedTamano = await this.prisma.tamano.create({
      data: tamanoData
    });

    return TamanoMapper.toDomain(savedTamano);
  }

  async update(tamano: Tamano): Promise<Tamano> {
    const tamanoData = TamanoMapper.toPrisma(tamano);
    
    const updatedTamano = await this.prisma.tamano.update({
      where: { id: tamano.id },
      data: {
        nombre: tamanoData.nombre,
        volumen: tamanoData.volumen,
        proteina: tamanoData.proteina,
        //fechaActualizacion: tamanoData.fechaActualizacion
      }
    });

    return TamanoMapper.toDomain(updatedTamano);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tamano.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Tamano | null> {
    const tamano = await this.prisma.tamano.findUnique({
      where: { id }
    });

    return tamano ? TamanoMapper.toDomain(tamano) : null;
  }

  async findByIds(ids: string[]): Promise<Tamano[]> {
    const tamanos = await this.prisma.tamano.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return TamanoMapper.toDomainList(tamanos);
  }

  async findMany(): Promise<Tamano[]> {
    const tamanos = await this.prisma.tamano.findMany({
      orderBy: {
        volumen: 'asc'
      }
    });

    return TamanoMapper.toDomainList(tamanos);
  }

  async findByNombre(nombre: string): Promise<Tamano | null> {
    const tamano = await this.prisma.tamano.findUnique({
      where: { nombre }
    });

    return tamano ? TamanoMapper.toDomain(tamano) : null;
  }

  async findByVolumenRange(minVolumen: number, maxVolumen: number): Promise<Tamano[]> {
    const tamanos = await this.prisma.tamano.findMany({
      where: {
        volumen: {
          gte: minVolumen,
          lte: maxVolumen
        }
      },
      orderBy: {
        volumen: 'asc'
      }
    });

    return TamanoMapper.toDomainList(tamanos);
  }

  async findByProteinaMinima(proteinaMinima: number): Promise<Tamano[]> {
    const tamanos = await this.prisma.tamano.findMany({
      where: {
        proteina: {
          gte: proteinaMinima
        }
      },
      orderBy: {
        proteina: 'desc'
      }
    });

    return TamanoMapper.toDomainList(tamanos);
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const count = await this.prisma.tamano.count({
      where: { nombre }
    });

    return count > 0;
  }
}