import { Sabor } from '../models/sabor.model';

export abstract class SaborRepository {
  abstract save(sabor: Sabor): Promise<Sabor>;
  abstract update(sabor: Sabor): Promise<Sabor>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Sabor | null>;
  abstract findByIds(ids: string[]): Promise<Sabor[]>;
  abstract findMany(): Promise<Sabor[]>;
  abstract findByNombre(nombre: string): Promise<Sabor | null>;
  abstract findByNombreContains(nombre: string): Promise<Sabor[]>;
  abstract findWithDescripcion(): Promise<Sabor[]>;
  abstract findWithoutDescripcion(): Promise<Sabor[]>;
  abstract existsByNombre(nombre: string): Promise<boolean>;
  abstract existsByNombreExcludingId(nombre: string, excludeId: string): Promise<boolean>;
}