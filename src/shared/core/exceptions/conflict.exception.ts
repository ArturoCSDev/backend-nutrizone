import { BaseException } from './base.exception';

export class ConflictException extends BaseException {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message: string = 'Recurso en conflicto', details?: any) {
    super(message, details);
  }
}