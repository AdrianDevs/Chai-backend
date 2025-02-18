import {
  Strategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import fs from 'fs';
import path from 'path';
import { UserServiceInterface } from '@/routes/auth/controllers';

const pathToPublicKey = path.join(__dirname, '../../keys', 'jwt_public.key');
const PUB_KEY = fs.readFileSync(pathToPublicKey, 'utf8');

const options: StrategyOptionsWithoutRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

export const jwtStrategy = (service: UserServiceInterface) =>
  new Strategy(options, (jwtPayload, done) => {
    // eslint-disable-next-line no-console
    console.log('JWT STRATEGY');
    // eslint-disable-next-line no-console
    console.log('- jwtPayload', jwtPayload);
    try {
      // const user = service.findUserById(jwtPayload.id);
      const user = jwtPayload.user;
      if (user) {
        return done(null, user); // user is now available in req.user
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err);
    }
  });
