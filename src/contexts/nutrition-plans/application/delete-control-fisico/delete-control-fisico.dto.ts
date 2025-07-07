import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteControlFisicoDto {
  @IsNotEmpty({ message: 'Control ID is required' })
  @IsUUID(4, { message: 'Control ID must be a valid UUID' })
  id: string;
}

export interface DeleteControlFisicoResponse {
  message: string;
  deletedControl: {
    id: string;
    clienteId: string;
    fechaControl: Date;
    fechaCreacion: Date;
  };
}