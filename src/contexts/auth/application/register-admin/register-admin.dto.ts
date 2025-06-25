import { 
    IsEmail, 
    IsNotEmpty, 
    MinLength, 
    IsOptional, 
    IsString,
    IsNumber,
    Min,
    Max,
    Matches
} from 'class-validator';

export class RegisterAdminDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;
  
  @Matches(/^\d{8}$/, { message: 'DNI must be 8 digits' })
  dni: string;
  
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Admin password must be at least 8 characters' })
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
  
  @IsOptional()
  @IsString()
  departamento?: string;
  
  @IsOptional()
  @IsNumber({}, { message: 'Access level must be a number' })
  @Min(1, { message: 'Minimum access level is 1' })
  @Max(5, { message: 'Maximum access level is 5' })
  nivelAcceso?: number;
}
  
export interface RegisterAdminResponse {
  user: {
    id: string;
    email: string;
    nombreCompleto: string;
    rol: string;
  };
  admin: {
    id: string;
    departamento: string | null;
    nivelAcceso: number;
  };
  message: string;
}
