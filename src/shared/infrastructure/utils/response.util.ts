import { SuccessResponse, ErrorResponse } from '../../core/types/response.types';

export class ResponseUtil {
  static success<T>(
    data: T, 
    message: string = 'Operación exitosa'
  ): SuccessResponse<T> {
    return {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(
    message: string, 
    code?: string, 
    details?: any
  ): ErrorResponse {
    return {
      status: 'error',
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static created<T>(
    data: T, 
    message: string = 'Recurso creado exitosamente'
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  static updated<T>(
    data: T, 
    message: string = 'Recurso actualizado exitosamente'
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  static deleted(message: string = 'Recurso eliminado exitosamente'): SuccessResponse<null> {
    return this.success(null, message);
  }
}
