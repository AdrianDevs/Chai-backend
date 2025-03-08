import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '@/database/types/user';
import { JwtToken } from '@/auth/helpers';
import { CustomError } from '@/errors';

export interface AuthServiceInterface {
  signup: (username: string, password: string) => Promise<User>;
  login: (
    username: string,
    password: string
  ) => Promise<(User & JwtToken) | undefined>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
  refreshToken: (userID: number, refreshToken: string) => Promise<JwtToken>;
  revokeToken: (userID: number) => Promise<void>;
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
          // token: userAndToken.token,
          // expiresIn: userAndToken.expires,
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
        refreshToken: userAndToken.refreshToken,
        refreshTokenExpires: userAndToken.refreshTokenExpires,
      });
    }
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userID = parseInt(req.body.userID);
      const refreshToken = req.headers['x-refresh-token'] as string;

      if (!userID || !refreshToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const userAndToken = await this.service.refreshToken(
        userID,
        refreshToken
      );

      if (!userAndToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      res.status(200).json({
        token: userAndToken.token,
        expiresIn: userAndToken.expires,
        refreshToken: userAndToken.refreshToken,
        refreshTokenExpires: userAndToken.refreshTokenExpires,
      });
    }
  );

  public revokeToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userID = req.user?.id;
      const refreshToken = req.headers['x-refresh-token'] as string;

      if (!userID || !refreshToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await this.service.revokeToken(userID);

      res.status(200).json({ message: 'Token revoked' });
    }
  );
}

const createController = (service: AuthServiceInterface) => {
  return new Controller(service);
};

export default createController;
