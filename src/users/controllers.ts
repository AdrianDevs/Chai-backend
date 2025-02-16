import { Express, NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { links } from './data';
import { body, validationResult } from 'express-validator';
import { User } from '@/database/types/user';
import passport from 'passport';
import { IVerifyOptions } from 'passport-local';

export interface UserServiceInterface {
  signup: (username: string, password: string) => Promise<User>;
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

  public showSignup = asyncHandler(async (req: Request, res: Response) => {
    res.render('signup', {
      links: links,
    });
  });

  private validateSignup = [
    body('username')
      .isAlphanumeric()
      .withMessage('Name must only contain letters')
      .isLength({ min: 3, max: 10 })
      .withMessage('Name must be between 3 and 10 characters'),
    body('password')
      .isLength({ min: 3, max: 10 })
      .withMessage('Password must be between 3 and 10 characters'),
  ];

  public signup = [
    this.validateSignup,
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .render('signup', { links: links, errors: errors.array() });
      }

      try {
        const { username, password } = req.body;
        const user = await this.service.signup(username, password);
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect('/');
        });
      } catch (err) {
        return next(err);
      }
    }),
  ];

  public showLogin = asyncHandler(async (req: Request, res: Response) => {
    res.render('login', {
      links: links,
    });
  });

  // public login = passport.authenticate('local', {
  //   successRedirect: '/',
  //   failureRedirect: '/user/login',
  // });

  public login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate(
        'local',
        (err: Error, user: Express.User, info: IVerifyOptions) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            return res.status(401).render('login', {
              links: links,
              errors: [{ msg: info.message }],
            });
          }
          req.login(user, (err) => {
            if (err) {
              return next(err);
            }
            return res.redirect('/');
          });
        }
      )(req, res, next);
    }
  );

  public logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      req.logout((err) => {
        if (err) {
          next(err);
        }
        res.redirect('/');
      });
    }
  );
}

const createController = (service: UserServiceInterface) => {
  return new Controller(service);
};

export default createController;
