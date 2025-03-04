import {
  Strategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import fs from 'fs';
import path from 'path';

const pathToPublicKey = path.join(__dirname, '../../keys', 'jwt_public.key');
const PUB_KEY = fs.readFileSync(pathToPublicKey, 'utf8');

const options: StrategyOptionsWithoutRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

/**
 * JWT Strategy
 * This strategy is used to authenticate users based on their JWT token
 * @param {StrategyOptionsWithoutRequest} options - JWT Strategy Options
 * @param {Function} verify - JWT Strategy Verify Function
 */
export const jwtStrategy = new Strategy(options, (jwtPayload, done) => {
  // console.log('JWT STRATEGY');
  // console.log('- jwtPayload', jwtPayload);
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
