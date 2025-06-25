import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { Usuario } from '../../domain/models/usuario.model';
import { Administrador } from '../../domain/models/administrador.model';
import { BcryptAdapter } from '../../../../shared/infrastructure/adapters/bcrypt/bcrypt.adapter';
import { ConflictException } from '../../../../shared/core/exceptions/conflict.exception';
import { RolUsuario } from '@prisma/client';
import { RegisterAdminDto, RegisterAdminResponse } from './register-admin.dto';

export class RegisterAdminUseCase {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private administradorRepository: AdministradorRepository
  ) {}

  async execute(dto: RegisterAdminDto): Promise<RegisterAdminResponse> {
    // 1. Validar que no exista usuario con ese email o DNI
    const existingUserByEmail = await this.usuarioRepository.findByEmail(dto.email);
    if (existingUserByEmail) {
      throw new ConflictException('Email ya registrado');
    }

    const existingUserByDni = await this.usuarioRepository.findByDni(dto.dni);
    if (existingUserByDni) {
      throw new ConflictException('DNI ya registrado');
    }

    // 2. Hashear contraseña
    const hashedPassword = await BcryptAdapter.hash(dto.password);

    // 3. Crear Usuario
    const usuario = Usuario.create({
      email: dto.email,
      dni: dto.dni,
      password: hashedPassword,
      nombre: dto.nombre,
      apellidoPaterno: dto.apellidoPaterno,
      apellidoMaterno: dto.apellidoMaterno,
      rol: RolUsuario.ADMINISTRADOR
    });

    // 4. Guardar Usuario
    const savedUsuario = await this.usuarioRepository.save(usuario);

    // 5. Crear Administrador
    const administrador = Administrador.create({
      usuarioId: savedUsuario.id,
      departamento: dto.departamento ?? null
    });

    // 6. Si se especifica nivel de acceso, actualizarlo
    const finalAdmin = dto.nivelAcceso 
      ? administrador.changeAccessLevel(dto.nivelAcceso)
      : administrador;

    // 7. Guardar Administrador
    const savedAdmin = await this.administradorRepository.save(finalAdmin);

    return {
      user: {
        id: savedUsuario.id,
        email: savedUsuario.email,
        nombreCompleto: savedUsuario.nombreCompleto,
        rol: savedUsuario.rol
      },
      admin: {
        id: savedAdmin.id,
        departamento: savedAdmin.departamento,
        nivelAcceso: savedAdmin.nivelAcceso
      },
      message: 'Administrador registrado correctamente'
    };
  }
}
