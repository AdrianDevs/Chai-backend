import { Express, NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '@/database/types/user';
import { JwtToken } from '@/utils';

export interface UserServiceInterface {
  signup: (username: string, password: string) => Promise<User & JwtToken>;
  login: (
    username: string,
    password: string
  ) => Promise<(User & JwtToken) | undefined>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsernameAndPassword: (
    username: string,
    password: string
  ) => Promise<User | undefined>;
}

class Controller {
  private service: UserServiceInterface;

  constructor(service: UserServiceInterface) {
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
        // req.login(user, (err) => {
        //   if (err) {
        //     return next(err);
        //   }
        //   return res.redirect('/');
        // });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('ERROR');
        return next(err);
      }
    }
  );

  public login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // passport.authenticate(
      //   'local',
      //   (err: Error, user: Express.User, info: IVerifyOptions) => {
      //     if (err) {
      //       return next(err);
      //     }
      //     if (!user) {
      //       return res.status(401).render('login', {
      //         links: links,
      //         errors: [{ msg: info.message }],
      //       });
      //     }
      //     req.login(user, (err) => {
      //       if (err) {
      //         return next(err);
      //       }
      //       return res.redirect('/');
      //     });
      //   }
      // )(req, res, next);

      const userAndToken = await this.service.login(
        req.body.username,
        req.body.password
      );

      if (!userAndToken) {
        res.status(401).json({ message: 'Incorrect username or password.' });
        return;
      }

      // const isValid = validatePassword(
      //   req.body.password,
      //   user.password,
      //   user.salt
      // );

      // if (!isValid) {
      //   res.status(401).json({ message: 'Incorrect username or password.' });
      //   return;
      // }

      // const tokenObjecct = issueJWT(user);
      res
        .status(200)
        .json({ token: userAndToken.token, expiresIn: userAndToken.expires });
    }
  );

  // public logout = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     req.logout((err) => {
  //       if (err) {
  //         next(err);
  //       }
  //       res.redirect('/');
  //     });
  //   }
  // );
}

const createController = (service: UserServiceInterface) => {
  return new Controller(service);
};

export default createController;
