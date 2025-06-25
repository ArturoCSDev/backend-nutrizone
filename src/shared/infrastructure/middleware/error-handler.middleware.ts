import { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../core/exceptions/base.exception';
import { config } from '../../config/environment';

export const errorHandlerMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => { // ← AGREGADO: tipo de retorno explícito
  // Log del error
  console.error('🚨 Error capturado:', {
    message: error.message,
    stack: config.isDevelopment ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Si es una excepción personalizada
  if (error instanceof BaseException) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      ...(config.isDevelopment && error.details && { details: error.details })
    });
    return; // ← IMPORTANTE: return para no continuar
  }

  // Errores de Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          status: 'error',
          message: 'Un registro con estos datos ya existe',
          code: 'DUPLICATE_RECORD',
          timestamp: new Date().toISOString()
        });
        return;
      case 'P2025':
        res.status(404).json({
          status: 'error',
          message: 'No se encontro el registro',
          code: 'RECORD_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        return;
      default:
        res.status(400).json({
          status: 'error',
          message: 'Error de la base de datos',
          code: 'DATABASE_ERROR',
          timestamp: new Date().toISOString()
        });
        return;
    }
  }

  // Errores de JWT
  if (error.message === 'TOKEN_EXPIRED') {
    res.status(401).json({
      status: 'error',
      message: 'El token ha expirado',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (error.message === 'INVALID_TOKEN') {
    res.status(401).json({
      status: 'error',
      message: 'Token invalido',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Error por defecto
  res.status(500).json({
    status: 'error',
    message: config.isDevelopment ? error.message : 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(config.isDevelopment && { stack: error.stack })
  });
};
