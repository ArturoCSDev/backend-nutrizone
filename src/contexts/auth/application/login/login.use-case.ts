import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { BcryptAdapter } from '../../../../shared/infrastructure/adapters/bcrypt/bcrypt.adapter';
import { JwtAdapter } from '../../../../shared/infrastructure/adapters/jwt/jwt.adapter';
import { UnauthorizedException } from '../../../../shared/core/exceptions/unauthorized.exception';
import { LoginDto, LoginResponse } from './login.dto';
import { NotFoundException } from '../../../../shared/core/exceptions/not-found.exception';

export class LoginUseCase {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private clienteRepository: ClienteRepository,
    private administradorRepository: AdministradorRepository
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponse> {
    // 1. Buscar usuario por DNI
    const usuario = await this.usuarioRepository.findByDni(dto.dni);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Verificar que esté activo
    if (!usuario.canLogin()) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // 3. Verificar contraseña
    const isValidPassword = await BcryptAdapter.compare(dto.password, usuario.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Generar token
    const token = JwtAdapter.generateToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    });

    // 5. Obtener perfil específico según rol
    let profile = {};
    
    if (usuario.isClient()) {
      const cliente = await this.clienteRepository.findByUsuarioId(usuario.id);
      if (cliente) {
        profile = {
          clienteId: cliente.id,
          hasCompleteProfile: cliente.hasCompleteProfile()
        };
      }
    } else if (usuario.isAdmin()) {
      const admin = await this.administradorRepository.findByUsuarioId(usuario.id);
      if (admin) {
        profile = {
          adminId: admin.id,
          departamento: admin.departamento,
          nivelAcceso: admin.nivelAcceso
        };
      }
    }

    return {
      user: {
        id: usuario.id,
        email: usuario.email,
        dni: usuario.dni,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
        active: usuario.active
      },
      profile,
      token
    };
  }
}
