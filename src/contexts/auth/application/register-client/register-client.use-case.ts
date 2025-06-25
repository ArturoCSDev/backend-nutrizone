import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { ClienteRepository } from '../../../client/domain/repositories/cliente.repository';
import { PreferenciaClienteRepository } from '../../../client/domain/repositories/preferencia-cliente.repository';
import { Usuario } from '../../domain/models/usuario.model';
import { Cliente } from '../../../client/domain/models/cliente.model';
import { PreferenciaCliente } from '../../../client/domain/models/preferencia-cliente.model';
import { BcryptAdapter } from '../../../../shared/infrastructure/adapters/bcrypt/bcrypt.adapter';
import { JwtAdapter } from '../../../../shared/infrastructure/adapters/jwt/jwt.adapter';
import { ConflictException } from '../../../../shared/core/exceptions/conflict.exception';
import { ValidationException } from '../../../../shared/core/exceptions/validation.exception';
import { RolUsuario } from '@prisma/client';
import { RegisterClientDto, RegisterClientResponse } from './register-client.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class RegisterClientUseCase {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private clienteRepository: ClienteRepository,
    private preferenciaRepository: PreferenciaClienteRepository
  ) {}

  async execute(dto: RegisterClientDto): Promise<RegisterClientResponse> {
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
      rol: RolUsuario.CLIENTE
    });

    // 4. Guardar Usuario
    const savedUsuario = await this.usuarioRepository.save(usuario);

    // 5. Crear Cliente
    const cliente = Cliente.create({
      usuarioId: savedUsuario.id,
      edad: dto.edad ?? null,
      peso: dto.peso ? new Decimal(dto.peso) : null,
      altura: dto.altura ? new Decimal(dto.altura) : null,
      nivelActividad: dto.nivelActividad ?? null,
      telefono: dto.telefono ?? null,
      fechaNacimiento: null, // Se puede calcular desde edad si se necesita
      genero: dto.genero ?? null,
      grasaCorporal: null,
      masaMuscular: null,
      metabolismoBasal: null
    });

    // 6. Guardar Cliente
    const savedCliente = await this.clienteRepository.save(cliente);

    // 7. Crear Preferencias (siempre, aunque estén vacías)
    const preferencias = PreferenciaCliente.create({
      clienteId: savedCliente.id,
      productosFavoritos: [],
      preferenciasDieteticas: dto.preferenciasDieteticas ?? [],
      alergenos: dto.alergenos ?? [],
      objetivosFitness: dto.objetivosFitness ?? [],
      diasEntrenamiento: dto.diasEntrenamiento ?? [],
      horariosEntrenamiento: dto.horariosEntrenamiento ?? [],
      horaDespertar: null,
      horaDormir: null
    });

    // 8. Guardar Preferencias
    await this.preferenciaRepository.save(preferencias);

    // 9. Generar token
    const token = JwtAdapter.generateToken({
      userId: savedUsuario.id,
      email: savedUsuario.email,
      rol: savedUsuario.rol
    });

    return {
      user: {
        id: savedUsuario.id,
        email: savedUsuario.email,
        nombreCompleto: savedUsuario.nombreCompleto,
        rol: savedUsuario.rol
      },
      cliente: {
        id: savedCliente.id,
        hasCompleteProfile: savedCliente.hasCompleteProfile()
      },
      token,
      message: 'Cliente registrado correctamente'
    };
  }
}
