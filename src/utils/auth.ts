import { Express } from 'express';
import store from '@/users/store';
import { Strategy as LocalStrategy } from 'passport-local';
import { DoneCallback } from 'passport';
import { User } from '@/database/types/user';
import { UserServiceInterface } from '@/users/controllers';

export const localStrategy = (service: UserServiceInterface) =>
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await service.findUserByUsernameAndPassword(
        username,
        password
      );
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username or password.',
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

export const serializeUser = (
  user: Express.User,
  done: (err: unknown, id?: number) => void
) => {
  // eslint-disable-next-line no-console
  console.log('serializeUser');
  // eslint-disable-next-line no-console
  console.log('- user', user);
  done(null, user.id);
};

export const deserializeUser = async (id: number, done: DoneCallback) => {
  // eslint-disable-next-line no-console
  console.log('deserializeUser');
  // eslint-disable-next-line no-console
  console.log('- id', id);
  try {
    const user: User | undefined = await store.findUserById(id);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log('- user not found');
      return done(null, false);
    }
    // eslint-disable-next-line no-console
    console.log('- user found');
    return done(null, user);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('- error', err);
    return done(err);
  }
};
