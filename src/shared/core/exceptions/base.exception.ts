export abstract class BaseException extends Error {
    abstract readonly statusCode: number;
    abstract readonly code: string;
    public readonly timestamp: string;

    constructor(
      message: string,
      public readonly details?: any
    ) {
      super(message);
      this.name = this.constructor.name;
      this.timestamp = new Date().toISOString();
      // Mantiene el stack trace
      Error.captureStackTrace(this, this.constructor);
    }

    // Para logging estructurado
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        details: this.details
      };
    }
}
