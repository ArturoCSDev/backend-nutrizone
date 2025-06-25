import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { ListUserAdminsDto, ListUserAdminsResponse, UserAdminItem } from './list-user-admins.dto';

export class ListUserAdminsUseCase {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private administradorRepository: AdministradorRepository
  ) {}

  async execute(dto: ListUserAdminsDto = {}): Promise<ListUserAdminsResponse> {
    // 1. Obtener todos los usuarios admin
    const usuarios = await this.usuarioRepository.findMany();
    const adminUsuarios = usuarios.filter(user => user.isAdmin());

    // 2. Obtener todos los administradores
    const administradores = await this.administradorRepository.findMany();
    
    // 3. Combinar datos
    let userAdmins: UserAdminItem[] = [];

    for (const usuario of adminUsuarios) {
      const admin = administradores.find(a => a.usuarioId === usuario.id);
      
      if (admin) {
        userAdmins.push({
          id: usuario.id,
          email: usuario.email,
          dni: usuario.dni,
          nombreCompleto: usuario.nombreCompleto,
          active: usuario.active,
          fechaCreacion: usuario.fechaCreacion,
          admin: {
            id: admin.id,
            departamento: admin.departamento,
            nivelAcceso: admin.nivelAcceso,
            ultimoAcceso: admin.ultimoAcceso,
            hasHighAccess: admin.hasHighAccess()
          }
        });
      }
    }

    // 4. Aplicar filtros
    if (dto.search) {
      const searchLower = dto.search.toLowerCase();
      userAdmins = userAdmins.filter(user => 
        user.nombreCompleto.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.dni.includes(searchLower)
      );
    }

    if (dto.onlyActive !== undefined) {
      userAdmins = userAdmins.filter(user => user.active === dto.onlyActive);
    }

    if (dto.departamento) {
      userAdmins = userAdmins.filter(user => 
        user.admin.departamento?.toLowerCase().includes(dto.departamento!.toLowerCase())
      );
    }

    if (dto.minAccessLevel) {
      userAdmins = userAdmins.filter(user => 
        user.admin.nivelAcceso >= dto.minAccessLevel!
      );
    }

    // 5. Calcular resumen
    const totalActive = userAdmins.filter(user => user.active).length;
    const totalInactive = userAdmins.filter(user => !user.active).length;

    const byAccessLevel = {
      level1: userAdmins.filter(user => user.admin.nivelAcceso === 1).length,
      level2: userAdmins.filter(user => user.admin.nivelAcceso === 2).length,
      level3: userAdmins.filter(user => user.admin.nivelAcceso === 3).length,
      level4: userAdmins.filter(user => user.admin.nivelAcceso === 4).length,
      level5: userAdmins.filter(user => user.admin.nivelAcceso === 5).length,
    };

    const byDepartment: Record<string, number> = {};
    userAdmins.forEach(user => {
      const dept = user.admin.departamento || 'Sin departamento';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    // 6. Ordenar por nivel de acceso (mayor primero) y luego por fecha
    userAdmins.sort((a, b) => {
      if (a.admin.nivelAcceso !== b.admin.nivelAcceso) {
        return b.admin.nivelAcceso - a.admin.nivelAcceso;
      }
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });

    return {
      users: userAdmins,
      total: userAdmins.length,
      summary: {
        totalActive,
        totalInactive,
        byAccessLevel,
        byDepartment
      }
    };
  }
}
