import { Express, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { User } from '@/database/types/user';
import passport from 'passport';
import { CustomError } from '@/errors';

export const JWT_EXPIRATION = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds
export const WEBSOCKET_TOKEN_EXPIRATION = 15 * 60; // 15 minutes in seconds

/**
 * -------------- HELPER FUNCTIONS ----------------
 */

/**
 *
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 *
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
export const validatePassword = (
  password: string,
  hash: string,
  salt: string
) => {
  const hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  return hash === hashVerify;
};

/**
 *
 * @param {*} password - The password string that the user inputs to the password field in the register form
 *
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 *
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password.
 * You would then store the hashed password in the database and then re-hash it to verify later (similar to what we do here)
 */
export const generatePassword = (password: string) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');

  return {
    salt: salt,
    hash: genHash,
  };
};

/**
 * This is the JWT token object that contains the JWT token and the expiration date
 * @param token - The JWT token
 * @param expires - How long the JWT token is valid for in seconds
 */
export type JWTTokenObject = {
  token: string;
  expires: number;
};

/**
 * This is the refresh token object that contains the refresh token and the expiration date
 * @param token - The refresh token
 * @param expires - How long the refresh token is valid for in seconds
 */
export type HashTokenObject = {
  token: string;
  expiryDate: Date;
  expiryEpoch: number;
  expiresInSeconds: number;
};

/**
 * This is the token object that is issued to the user upon successful login
 * The token is signed with the private key and the user ID is set as the payload
 * @param token - The JWT token
 * @param expires - How long the JWT token is valid for in seconds
 * @param refreshToken - The refresh token
 * @param refreshTokenExpires - The expiration date of the refresh token
 * @param webSocketToken - The web socket token
 * @param webSocketTokenExpires - The expiration date of the web socket token
 */
export type TokenObject = {
  token: string;
  expiryDate: Date;
  expiryEpoch: number;
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiryDate: Date;
  refreshTokenExpiryEpoch: number;
  refreshTokenExpiresInSeconds: number;
  webSocketToken: string;
  webSocketTokenExpiryDate: Date;
  webSocketTokenExpiryEpoch: number;
  webSocketTokenExpiresInSeconds: number;
};

export enum TokenType {
  REFRESH = 'refresh',
  WEBSOCKET = 'websocket',
}

/**
 * Generates a hash token for the user by combining a random string with the user ID
 * The format is: base64(userId)_randomBytes
 * @param userId - The user's ID to associate with the refresh token
 * @param type - The type of token to generate
 * @returns The generated refresh token
 */
export function generateHashToken(
  userId: string | number,
  type: TokenType
): HashTokenObject {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const userIdBase64 = Buffer.from(userId.toString()).toString('base64');
  const token = `${userIdBase64}_${randomBytes}`;
  const expiresInSeconds =
    type === TokenType.REFRESH
      ? REFRESH_TOKEN_EXPIRATION
      : WEBSOCKET_TOKEN_EXPIRATION;
  const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);
  const expiryEpoch = expiryDate.getTime();
  return { token, expiryDate, expiryEpoch, expiresInSeconds };
}

/**
 * Generates a refresh token for the user by combining a random string with the user ID
 * The format is: base64(userId)_randomBytes
 * @param userId - The user's ID to associate with the refresh token
 * @returns The generated refresh token
 */
// export function generateRefreshToken(
//   userId: string | number
// ): RefreshTokenObject {
//   const randomBytes = crypto.randomBytes(32).toString('hex');
//   const userIdBase64 = Buffer.from(userId.toString()).toString('base64');
//   const token = `${userIdBase64}_${randomBytes}`;
//   const expiresInSeconds = REFRESH_TOKEN_EXPIRATION;
//   const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);
//   const expiryEpoch = expiryDate.getTime();
//   return {
//     token,
//     expiryDate,
//     expiryEpoch,
//     expiresInSeconds,
//   };
// }

/**
 * Extracts the user ID from a refresh token
 * @param token - The refresh token
 * @returns The user ID or null if the token is invalid
 */
export function extractUserIdFromRefreshToken(token: string): string | null {
  try {
    const [userIdBase64] = token.split('_');
    return Buffer.from(userIdBase64, 'base64').toString();
  } catch {
    return null;
  }
}

/**
 * Issues a JWT token, a refresh token, and a web socket token
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the database user ID
 * @param tokenExpiresIn - The expiration time of the JWT token in seconds
 */
export function issueTokens(user: User, tokenExpiresIn?: number): TokenObject {
  const _id = user.id;
  const _user = { id: user.id, username: user.username };

  const jwtExpiresInSeconds = tokenExpiresIn || JWT_EXPIRATION; // 15 minutes in seconds
  const jwtExpires = new Date(Date.now() + jwtExpiresInSeconds * 1000);

  const payload = {
    sub: _id,
    user: _user,
  };

  const pathToPublicKey = path.join(__dirname, '../../keys', 'jwt_private.key');
  const PRIV_KEY = fs.readFileSync(pathToPublicKey, 'utf8');

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {
    expiresIn: jwtExpiresInSeconds,
    algorithm: 'RS256',
  });

  // Generate refresh token
  const refreshTokenObject = generateHashToken(_id, TokenType.REFRESH);

  // Generate web socket token
  const webSocketTokenObject = generateHashToken(_id, TokenType.WEBSOCKET);

  return {
    token: signedToken,
    expiryDate: jwtExpires,
    expiryEpoch: jwtExpires.getTime(),
    expiresInSeconds: jwtExpiresInSeconds,
    refreshToken: refreshTokenObject.token,
    refreshTokenExpiryDate: refreshTokenObject.expiryDate,
    refreshTokenExpiryEpoch: refreshTokenObject.expiryEpoch,
    refreshTokenExpiresInSeconds: refreshTokenObject.expiresInSeconds,
    webSocketToken: webSocketTokenObject.token,
    webSocketTokenExpiryDate: webSocketTokenObject.expiryDate,
    webSocketTokenExpiryEpoch: webSocketTokenObject.expiryEpoch,
    webSocketTokenExpiresInSeconds: webSocketTokenObject.expiresInSeconds,
  };
}

/**
 * Sets the refresh token cookie
 * @param res - The response object
 * @param refreshToken - The refresh token to set
 * @returns The response object
 */
export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  refreshTokenExpires: Date
) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.ENV === 'PROD' ? true : false,
    sameSite: process.env.ENV === 'PROD' ? 'strict' : 'none',
    expires: refreshTokenExpires,
    // path: '/auth/refresh-token',
    path: '/',
    maxAge: refreshTokenExpires.getTime() - Date.now(),
  });

  return res;
}

/**
 * -------------- MIDDLEWARE ----------------
 */

/**
 * This middleware function is used to check if the user is authenticated by checking the JWT token
 */
// export const checkAuthenticated = passport.authenticate('jwt', {
//   session: false,
// });
export const checkAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'jwt',
    {
      session: false,
    },
    (err: unknown, user?: Express.User | false | null) => {
      // If authentication failed, `user` will be set to false. If an exception occurred, `err` will be set.

      if (err) {
        const error = new CustomError(401, 'Autehntication failed');
        return next(error);
      }

      if (!user) {
        const error = new CustomError(401, 'Unauthorized');
        return next(error);
      }

      req.logIn(user, { session: false }, (error) => {
        if (error) {
          // console.log('--- have error logging in user');
          const customError = new CustomError(
            401,
            'Autehntication failed when loggin in user'
          );
          return next(customError);
        }
      });

      next();
    }
  )(req, res, next);
};
