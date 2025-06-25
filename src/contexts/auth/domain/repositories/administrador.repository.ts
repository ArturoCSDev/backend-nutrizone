import { Administrador } from '../models/administrador.model';

export abstract class AdministradorRepository {
  abstract save(administrador: Administrador): Promise<Administrador>;
  abstract update(administrador: Administrador): Promise<Administrador>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Administrador | null>;
  abstract findByIds(ids: string[]): Promise<Administrador[]>;
  abstract findMany(): Promise<Administrador[]>;
  abstract findByUsuarioId(usuarioId: string): Promise<Administrador | null>;
}
