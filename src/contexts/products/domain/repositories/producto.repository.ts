import { Producto, MomentoDelDia } from '../models/producto.model';

export abstract class ProductoRepository {
  abstract save(producto: Producto): Promise<Producto>;
  abstract update(producto: Producto): Promise<Producto>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Producto | null>;
  abstract findByIds(ids: string[]): Promise<Producto[]>;
  abstract findMany(): Promise<Producto[]>;
  abstract findByNombre(nombre: string): Promise<Producto | null>;
  abstract findByNombreContains(nombre: string): Promise<Producto[]>;
  abstract findByCategoriaId(categoriaId: string): Promise<Producto[]>;
  abstract findBySaborId(saborId: string): Promise<Producto[]>;
  abstract findByTamanoId(tamanoId: string): Promise<Producto[]>;
  abstract findByPrecioRange(minPrecio: number, maxPrecio: number): Promise<Producto[]>;
  abstract findByMomentoRecomendado(momento: MomentoDelDia): Promise<Producto[]>;
  abstract findWithIngredientes(): Promise<Producto[]>;
  abstract findWithEtiquetas(): Promise<Producto[]>;
  abstract existsByNombre(nombre: string): Promise<boolean>;
  abstract existsByNombreExcludingId(nombre: string, excludeId: string): Promise<boolean>;
}