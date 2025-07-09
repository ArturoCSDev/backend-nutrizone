import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListUserClientsDto {
  @IsOptional()
  @IsString()
  search?: string; // Buscar por nombre o email

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyCompleteProfiles?: boolean;

  @IsOptional()
  @IsString()
  clientId?: string; // Nuevo: para obtener cliente específico por ID de cliente
}

export interface UserClientItem {
  // Datos de Usuario
  id: string; // ID del usuario
  email: string;
  dni: string;
  nombreCompleto: string;
  active: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  
  // Datos de Cliente
  cliente: {
    id: string; // ID de la tabla cliente (este es el que necesitamos)
    edad: number | null;
    peso: number | null;
    altura: number | null;
    telefono: string | null;
    genero: string | null;
    hasCompleteProfile: boolean;
    imc: number | null;
  };
}

export interface ListUserClientsResponse {
  users: UserClientItem[];
  total: number;
  summary: {
    totalActive: number;
    totalInactive: number;
    totalCompleteProfiles: number;
    totalIncompleteProfiles: number;
  };
}
