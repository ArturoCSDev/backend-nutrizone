import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListUserAdminsDto {
  @IsOptional()
  @IsString()
  search?: string; // Buscar por nombre o email

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyActive?: boolean;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  minAccessLevel?: number;
}

export interface UserAdminItem {
  // Datos de Usuario
  id: string;
  email: string;
  dni: string;
  nombreCompleto: string;
  active: boolean;
  fechaCreacion: Date;
  
  // Datos de Admin
  admin: {
    id: string;
    departamento: string | null;
    nivelAcceso: number;
    ultimoAcceso: Date | null;
    hasHighAccess: boolean;
  };
}

export interface ListUserAdminsResponse {
  users: UserAdminItem[];
  total: number;
  summary: {
    totalActive: number;
    totalInactive: number;
    byAccessLevel: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
    };
    byDepartment: Record<string, number>;
  };
}
