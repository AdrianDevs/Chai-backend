import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '@/database/types/user';
import { JwtToken } from '@/utils';
import { CustomError } from '@/errors';

export interface AuthServiceInterface {
  signup: (username: string, password: string) => Promise<User & JwtToken>;
  login: (
    username: string,
    password: string
  ) => Promise<(User & JwtToken) | undefined>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
}

class Controller {
  private service: AuthServiceInterface;

  constructor(service: AuthServiceInterface) {
    this.service = service;
  }

  public signup = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, password } = req.body;
        const userAndToken = await this.service.signup(username, password);
        res.status(201).json({
          id: userAndToken.id,
          username: userAndToken.username,
          token: userAndToken.token,
          expiresIn: userAndToken.expires,
        });
      } catch (err) {
        if (err instanceof CustomError) {
          res.status(err.status).json({ message: err.message });
          return;
        }
        return next(err);
      }
    }
  );

  public login = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userAndToken = await this.service.login(
        req.body.username,
        req.body.password
      );

      if (!userAndToken) {
        res.status(401).json({ message: 'Incorrect username or password.' });
        return;
      }

      res.status(200).json({
        id: userAndToken.id,
        username: userAndToken.username,
        token: userAndToken.token,
        expiresIn: userAndToken.expires,
      });
    }
  );
}

const createController = (service: AuthServiceInterface) => {
  return new Controller(service);
};

export default createController;
