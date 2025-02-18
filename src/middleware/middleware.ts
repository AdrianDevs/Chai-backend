import { CustomError, ErrorType } from '@/errors';
import { Request, Response, NextFunction } from 'express';

export class ContextLog {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  public log = (message: string) => {
    // eslint-disable-next-line no-console
    console.log(this.context, message);
  };
}

export const contextLoggingMiddleware =
  (name: string) => async (req: Request, res: Response, next: NextFunction) => {
    req.context = new ContextLog(name);
    next();
  };

export const currentUserMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.locals.user = req.user;
  next();
};

export const handleUnauthorizedError = async (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.statusCode === 401 && err.type === ErrorType.UNAUTHORIZED) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    next(err);
  }
};

export const handleUnknownError = async (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res
    .status(err.statusCode || 500)
    .json({ statusCode: err.statusCode || 500, message: err.message });
};
