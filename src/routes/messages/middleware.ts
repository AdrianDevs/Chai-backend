import { NextFunction, Response, Request } from 'express';
import './types'; // Import the module to extend the Request interface

export const messageCustomFieldMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.customMessageField = 'message request';
  next();
};
