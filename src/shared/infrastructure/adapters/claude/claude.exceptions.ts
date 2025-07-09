import { BaseException } from '../../../core/exceptions/base.exception';

export class ClaudeConnectionException extends BaseException {
  readonly statusCode = 503;
  readonly code = 'CLAUDE_CONNECTION_ERROR';

  constructor(message: string = 'Error de conexión con Claude AI', details?: any) {
    super(message, details);
  }
}

export class ClaudeTimeoutException extends BaseException {
  readonly statusCode = 504;
  readonly code = 'CLAUDE_TIMEOUT';

  constructor(message: string = 'Timeout en la conexión con Claude AI', details?: any) {
    super(message, details);
  }
}

export class ClaudeParsingException extends BaseException {
  readonly statusCode = 422;
  readonly code = 'CLAUDE_PARSING_ERROR';

  constructor(message: string = 'Error al procesar la respuesta de Claude AI', details?: any) {
    super(message, details);
  }
}

export class ClaudeApiException extends BaseException {
  readonly statusCode = 502;
  readonly code = 'CLAUDE_API_ERROR';

  constructor(message: string = 'Error en la API de Claude AI', details?: any) {
    super(message, details);
  }
}

export class ClaudeRateLimitException extends BaseException {
  readonly statusCode = 429;
  readonly code = 'CLAUDE_RATE_LIMIT';

  constructor(message: string = 'Límite de peticiones excedido en Claude AI', details?: any) {
    super(message, details);
  }
}