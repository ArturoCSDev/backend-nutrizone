import { Categoria, TipoProducto } from '../models/categoria.model';

export abstract class CategoriaRepository {
  abstract save(categoria: Categoria): Promise<Categoria>;
  abstract update(categoria: Categoria): Promise<Categoria>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Categoria | null>;
  abstract findByIds(ids: string[]): Promise<Categoria[]>;
  abstract findMany(): Promise<Categoria[]>;
  abstract findByNombre(nombre: string): Promise<Categoria | null>;
  abstract findByTipoProducto(tipoProducto: TipoProducto): Promise<Categoria[]>;
  abstract existsByNombre(nombre: string): Promise<boolean>;
}