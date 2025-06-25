import { BaseException } from './base.exception';

export class ForbiddenException extends BaseException {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';

  constructor(message: string = 'Acceso denegado', details?: any) {
    super(message, details);
  }
}
