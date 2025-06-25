import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El DNI es requerido' })
  @IsString({ message: 'El DNI debe ser un texto válido' })
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos' })
  dni!: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto válido' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    dni: string;
    nombreCompleto: string;
    rol: string;
    active: boolean;
  };
  profile?: {
    // Si es cliente
    clienteId?: string;
    hasCompleteProfile?: boolean;
    // Si es admin
    adminId?: string;
    departamento?: string;
    nivelAcceso?: number;
  };
  token: string;
}
