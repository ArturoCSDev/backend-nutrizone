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
}

export interface UserClientItem {
  // Datos de Usuario
  id: string;
  email: string;
  dni: string;
  nombreCompleto: string;
  active: boolean;
  fechaCreacion: Date;
  
  // Datos de Cliente
  cliente: {
    id: string;
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
