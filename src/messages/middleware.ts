import { NextFunction, Response, Request } from 'express';
import './types'; // Import the module to extend the Request interface
import asyncHandler from 'express-async-handler';
import { CustomError, ErrorType } from '@/errors';

export const messageCustomFieldMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.customMessageField = 'message request';
  next();
};

export const checkAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      next();
    } else {
      throw new CustomError(
        'Please login to view resource.',
        401,
        ErrorType.UNAUTHORIZED
      );
    }
  }
);
