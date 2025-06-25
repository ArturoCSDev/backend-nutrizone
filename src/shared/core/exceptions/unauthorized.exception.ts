import { BaseException } from './base.exception';

export class UnauthorizedException extends BaseException {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';

  constructor(message: string = 'Acceso no autorizado', details?: any) {
    super(message, details);
  }
}
