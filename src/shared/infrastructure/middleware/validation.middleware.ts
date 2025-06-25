import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from '../../core/exceptions/validation.exception';

export const validationMiddleware = <T extends object>(type: new () => T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Transformar el body a la clase DTO
      const dto = plainToClass(type, req.body);
      
      // Validar el DTO
      const errors = await validate(dto);
      
      if (errors.length > 0) {
        // Formatear errores
        const formattedErrors = errors.map(error => ({
          field: error.property,
          errors: Object.values(error.constraints || {})
        }));
        
        throw new ValidationException('Validación fallida', formattedErrors);
      }
      
      // Si pasa la validación, reemplazar req.body con el DTO validado
      req.body = dto;
      next();
    } catch (error) {
      next(error);
    }
  };
};
