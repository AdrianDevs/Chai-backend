import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '@/database/types/user';
import {
  HashTokenObject,
  TokenObject,
  setRefreshTokenCookie,
} from '@/auth/helpers';
import { CustomError } from '@/errors';

export interface AuthServiceInterface {
  signup: (username: string, password: string) => Promise<User>;
  login: (
    username: string,
    password: string
  ) => Promise<(User & TokenObject) | undefined>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
  refreshTokens: (userID: number, refreshToken: string) => Promise<TokenObject>;
  revokeTokens: (userID: number) => Promise<void>;
  generateWebSocketToken: (userID: number) => Promise<HashTokenObject>;
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

      if (userAndToken.refreshToken && userAndToken.refreshTokenExpiryEpoch) {
        setRefreshTokenCookie(
          res,
          userAndToken.refreshToken,
          userAndToken.refreshTokenExpiryDate
        );
      }

      res.status(200).json({
        id: userAndToken.id,
        username: userAndToken.username,
        jwt: userAndToken.token,
        expiryDate: userAndToken.expiryDate,
        expiryEpoch: userAndToken.expiryEpoch,
        expiresInSeconds: userAndToken.expiresInSeconds,
        refreshToken: userAndToken.refreshToken,
        refreshTokenExpiryDate: userAndToken.refreshTokenExpiryDate,
        refreshTokenExpiryEpoch: userAndToken.refreshTokenExpiryEpoch,
        refreshTokenExpiresInSeconds: userAndToken.refreshTokenExpiresInSeconds,
        webSocketToken: userAndToken.webSocketToken,
        webSocketTokenExpiryDate: userAndToken.webSocketTokenExpiryDate,
        webSocketTokenExpiryEpoch: userAndToken.webSocketTokenExpiryEpoch,
        webSocketTokenExpiresInSeconds:
          userAndToken.webSocketTokenExpiresInSeconds,
      });
    }
  );

  public refreshTokens = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userID = parseInt(req.body.userID);
      const refreshTokenFromCookie = req.cookies?.refreshToken;
      const refreshTokenFromHeader = req.headers['x-refresh-token'] as string;

      if (!userID || !(refreshTokenFromCookie || refreshTokenFromHeader)) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const userAndToken = await this.service.refreshTokens(
        userID,
        refreshTokenFromCookie || refreshTokenFromHeader
      );

      if (!userAndToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      res.status(200).json({
        jwt: userAndToken.token,
        expiryDate: userAndToken.expiryDate,
        expiryEpoch: userAndToken.expiryEpoch,
        expiresInSeconds: userAndToken.expiresInSeconds,
        refreshToken: userAndToken.refreshToken,
        refreshTokenExpiryDate: userAndToken.refreshTokenExpiryDate,
        refreshTokenExpiryEpoch: userAndToken.refreshTokenExpiryEpoch,
        refreshTokenExpiresInSeconds: userAndToken.refreshTokenExpiresInSeconds,
        webSocketToken: userAndToken.webSocketToken,
        webSocketTokenExpiryDate: userAndToken.webSocketTokenExpiryDate,
        webSocketTokenExpiryEpoch: userAndToken.webSocketTokenExpiryEpoch,
        webSocketTokenExpiresInSeconds:
          userAndToken.webSocketTokenExpiresInSeconds,
      });
    }
  );

  public revokeTokens = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userID = req.user?.id;

      if (!userID) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await this.service.revokeTokens(userID);

      res.status(200).json({ message: 'Token revoked' });
    }
  );

  public getWsToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userID = req.user?.id;
      const refreshTokenFromCookie = req.cookies?.refreshToken;
      const refreshTokenFromHeader = req.headers['x-refresh-token'] as string;

      if (!userID || !(refreshTokenFromCookie || refreshTokenFromHeader)) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      try {
        const tokenObject = await this.service.generateWebSocketToken(userID);

        res.status(200).json({
          token: tokenObject.token,
          expiryDate: tokenObject.expiryDate,
          expiryEpoch: tokenObject.expiryEpoch,
          expiresInSeconds: tokenObject.expiresInSeconds,
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
}

const createController = (service: AuthServiceInterface) => {
  return new Controller(service);
};

export default createController;
