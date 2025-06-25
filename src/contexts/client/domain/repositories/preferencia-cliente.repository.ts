import { PreferenciaCliente } from '../models/preferencia-cliente.model';

export abstract class PreferenciaClienteRepository {
  abstract save(preferencia: PreferenciaCliente): Promise<PreferenciaCliente>;
  abstract update(preferencia: PreferenciaCliente): Promise<PreferenciaCliente>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<PreferenciaCliente | null>;
  abstract findByIds(ids: string[]): Promise<PreferenciaCliente[]>;
  abstract findMany(): Promise<PreferenciaCliente[]>;
  abstract findByClienteId(clienteId: string): Promise<PreferenciaCliente | null>;
}
