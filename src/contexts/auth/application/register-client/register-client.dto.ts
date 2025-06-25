import { 
    IsEmail, 
    IsNotEmpty, 
    MinLength, 
    IsOptional, 
    IsNumber, 
    IsString, 
    IsArray, 
    IsEnum,
    Min,
    Max,
    Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { NivelActividad, ObjetivoNutricional, DiaSemana } from '@prisma/client';

export class RegisterClientDto {
  // Datos de Usuario
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @Matches(/^\d{8}$/, { message: 'DNI must be 8 digits' })
  dni: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'Paternal surname is required' })
  @IsString()
  apellidoPaterno: string;

  @IsNotEmpty({ message: 'Maternal surname is required' })
  @IsString()
  apellidoMaterno: string;

  // Datos de Cliente
  @IsOptional()
  @IsNumber({}, { message: 'Age must be a number' })
  @Min(16, { message: 'Minimum age is 16' })
  @Max(100, { message: 'Maximum age is 100' })
  edad?: number;

  @IsOptional()
  @Type(() => Number)
  peso?: number;

  @IsOptional()
  @Type(() => Number)
  altura?: number;

  @IsOptional()
  @IsEnum(NivelActividad)
  nivelActividad?: NivelActividad;

  @IsOptional()
  @Matches(/^9\d{8}$/, { message: 'Phone must be valid Peruvian format' })
  telefono?: string;

  @IsOptional()
  @IsString()
  genero?: string;

  // Datos de Preferencias
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferenciasDieteticas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alergenos?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(ObjetivoNutricional, { each: true })
  objetivosFitness?: ObjetivoNutricional[];

  @IsOptional()
  @IsArray()
  @IsEnum(DiaSemana, { each: true })
  diasEntrenamiento?: DiaSemana[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  horariosEntrenamiento?: string[];
}
 
export interface RegisterClientResponse {
  user: {
    id: string;
    email: string;
    nombreCompleto: string;
    rol: string;
  };
  cliente: {
    id: string;
    hasCompleteProfile: boolean;
  };
  token: string;
  message: string;
}
