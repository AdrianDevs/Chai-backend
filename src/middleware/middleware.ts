import { CustomError } from '@/errors';
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
  err: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    res
      .status(err.status)
      .json({ status: err.status, message: err.message, errors: err.errors });
  } else {
    next(err);
  }
};

export const handleUnknownError = async (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(500).json({ status: 500, message: err.message });
};
