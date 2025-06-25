import { Cliente } from '../models/cliente.model';

export abstract class ClienteRepository {
  abstract save(cliente: Cliente): Promise<Cliente>;
  abstract update(cliente: Cliente): Promise<Cliente>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Cliente | null>;
  abstract findByIds(ids: string[]): Promise<Cliente[]>;
  abstract findMany(): Promise<Cliente[]>;
  abstract findByUsuarioId(usuarioId: string): Promise<Cliente | null>;
}
