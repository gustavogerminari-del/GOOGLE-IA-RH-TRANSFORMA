/**
 * Módulo NÚCLEO - Tratamento Centralizado de Erros
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Acesso não autorizado. Autentique-se para continuar.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Você não possui permissão para realizar esta operação.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado.`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados informados inválidos.', details?: Record<string, unknown>) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export interface ErrorLogPayload {
  message: string;
  code: string;
  statusCode: number;
  timestamp: string;
  stack?: string;
  details?: Record<string, unknown>;
}

export const logCentralizedError = (error: unknown, context?: string): ErrorLogPayload => {
  const timestamp = new Date().toISOString();
  let payload: ErrorLogPayload;

  if (error instanceof AppError) {
    payload = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp,
      stack: error.stack,
      details: error.details,
    };
  } else if (error instanceof Error) {
    payload = {
      message: error.message,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      timestamp,
      stack: error.stack,
    };
  } else {
    payload = {
      message: String(error) || 'Erro desconhecido',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      timestamp,
    };
  }

  // Log no console em desenvolvimento
  console.error(`[NÚCLEO ERROR]${context ? ` [${context}]` : ''}:`, payload);

  return payload;
};
