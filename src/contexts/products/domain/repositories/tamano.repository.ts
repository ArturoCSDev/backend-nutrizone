import { Tamano } from '../models/tamano.model';

export abstract class TamanoRepository {
  abstract save(tamano: Tamano): Promise<Tamano>;
  abstract update(tamano: Tamano): Promise<Tamano>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Tamano | null>;
  abstract findByIds(ids: string[]): Promise<Tamano[]>;
  abstract findMany(): Promise<Tamano[]>;
  abstract findByNombre(nombre: string): Promise<Tamano | null>;
  abstract findByVolumenRange(minVolumen: number, maxVolumen: number): Promise<Tamano[]>;
  abstract findByProteinaMinima(proteinaMinima: number): Promise<Tamano[]>;
  abstract existsByNombre(nombre: string): Promise<boolean>;
}