export type AppErrorCode =
  'not-found' | 'forbidden' | 'unauthenticated' | 'network' | 'validation' | 'unknown';

/** Base error for failures Cerebro knows how to present. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: AppErrorCode = 'unknown',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(
    readonly entity: string,
    readonly id: string | number,
  ) {
    super(`${entity} "${id}" bulunamadı.`, 'not-found');
    this.name = 'NotFoundError';
  }
}

/** The signed-in user lacks the permission for this operation (server-side decision). */
export class ForbiddenError extends AppError {
  constructor(message = 'Bu işlemi yapma yetkiniz yok.') {
    super(message, 'forbidden');
    this.name = 'ForbiddenError';
  }
}

export class UnauthenticatedError extends AppError {
  constructor() {
    super('Oturumunuz sona erdi. Devam etmek için tekrar giriş yapın.', 'unauthenticated');
    this.name = 'UnauthenticatedError';
  }
}

/** Business-rule violation; `field` names the form field to attach the message to, when known. */
export class ValidationError extends AppError {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message, 'validation');
    this.name = 'ValidationError';
  }
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof AppError && error.code === 'not-found';
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof AppError && error.code === 'forbidden';
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof AppError && error.code === 'validation';
}

/** A user-presentable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Beklenmeyen bir hata oluştu.';
}
