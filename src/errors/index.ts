export enum ErrorType {
  UNAUTHORIZED = 'UnauthorizedError',
  MESSAGE_NOT_FOUND = 'MessageNotFoundError',
  USER_NOT_FOUND = 'UserNotFoundError',
  UNKNOWN = 'UnknownError',
}

export class CustomError extends Error {
  public statusCode: number;
  public type: ErrorType;

  constructor(message: string, statusCode?: number, type?: ErrorType) {
    // eslint-disable-next-line no-console
    console.log('CustomError constructor');
    super(message);
    this.statusCode = statusCode || 500;
    this.type = type || ErrorType.UNKNOWN;
  }
}
