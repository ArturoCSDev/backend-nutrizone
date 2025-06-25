import { Usuario } from '../models/usuario.model';

export abstract class UsuarioRepository {
  abstract save(usuario: Usuario): Promise<Usuario>;
  abstract update(usuario: Usuario): Promise<Usuario>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Usuario | null>;
  abstract findByIds(ids: string[]): Promise<Usuario[]>;
  abstract findMany(): Promise<Usuario[]>;
  abstract findByEmail(email: string): Promise<Usuario | null>;
  abstract findByDni(dni: string): Promise<Usuario | null>;
}
