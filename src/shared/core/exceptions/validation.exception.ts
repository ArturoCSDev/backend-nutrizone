import { BaseException } from './base.exception';

export class ValidationException extends BaseException {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string = 'Validación fallida', details?: any) {
    super(message, details);
  }
}
