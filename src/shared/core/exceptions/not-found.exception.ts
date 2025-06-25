import { BaseException } from './base.exception';

export class NotFoundException extends BaseException {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} No encontrado`, details);
  }
}
