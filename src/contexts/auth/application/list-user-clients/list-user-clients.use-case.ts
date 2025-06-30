import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { ListUserClientsDto, ListUserClientsResponse, UserClientItem } from './list-user-clients.dto';

export class ListUserClientsUseCase {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private clienteRepository: ClienteRepository
  ) {}

  async execute(dto: ListUserClientsDto = {}): Promise<ListUserClientsResponse> {
    // 1. Obtener todos los usuarios clientes
    const usuarios = await this.usuarioRepository.findMany();
    const clienteUsuarios = usuarios.filter(user => user.isClient());

    // 2. Obtener todos los clientes
    const clientes = await this.clienteRepository.findMany();
    
    // 3. Combinar datos
    let userClients: UserClientItem[] = [];

    for (const usuario of clienteUsuarios) {
      const cliente = clientes.find(c => c.usuarioId === usuario.id);
      
      if (cliente) {
        userClients.push({
          id: usuario.id,
          email: usuario.email,
          dni: usuario.dni,
          nombreCompleto: usuario.nombreCompleto,
          active: usuario.active,
          fechaCreacion: usuario.fechaCreacion,
          cliente: {
            id: cliente.id,
            edad: cliente.edad,
            peso: cliente.peso ? Number(cliente.peso) : null,
            altura: cliente.altura ? Number(cliente.altura) : null,
            telefono: cliente.telefono,
            genero: cliente.genero,
            hasCompleteProfile: cliente.hasCompleteProfile(),
            imc: cliente.imc ? Number(cliente.imc) : null
          }
        });
      }
    }

    // 4. Aplicar filtros
    if (dto.search) {
      const searchLower = dto.search.toLowerCase();
      userClients = userClients.filter(user => 
        user.nombreCompleto.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.dni.includes(searchLower)
      );
    }

    if (dto.onlyActive !== undefined) {
      userClients = userClients.filter(user => user.active === dto.onlyActive);
    }

    if (dto.onlyCompleteProfiles !== undefined) {
      userClients = userClients.filter(user => 
        user.cliente.hasCompleteProfile === dto.onlyCompleteProfiles
      );
    }

    // 5. Calcular resumen
    const totalActive = userClients.filter(user => user.active).length;
    const totalInactive = userClients.filter(user => !user.active).length;
    const totalCompleteProfiles = userClients.filter(user => user.cliente.hasCompleteProfile).length;
    const totalIncompleteProfiles = userClients.filter(user => !user.cliente.hasCompleteProfile).length;

    // 6. Ordenar por fecha de creación (más recientes primero)
    userClients.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    return {
      users: userClients,
      total: userClients.length,
      summary: {
        totalActive,
        totalInactive,
        totalCompleteProfiles,
        totalIncompleteProfiles
      }
    };
  }
}
