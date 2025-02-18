import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { User } from '@/database/types/user';
import passport from 'passport';

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
 * This is the JWT token that is issued to the user upon successful login
 * The token is signed with the private key and the user ID is set as the payload
 * The token is set to expire in 1 day
 */
export type JwtToken = {
  token: string;
  expires: string;
};

/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the database user ID
 */
export function issueJWT(user: User): JwtToken {
  const _id = user.id;
  const _user = { id: user.id, username: user.username };

  const expiresIn = '1d';

  const payload = {
    sub: _id,
    user: _user,
    iat: Date.now(),
  };

  const pathToPublicKey = path.join(__dirname, '../../keys', 'jwt_private.key');
  const PRIV_KEY = fs.readFileSync(pathToPublicKey, 'utf8');

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {
    expiresIn: expiresIn,
    algorithm: 'RS256',
  });

  return {
    token: 'Bearer ' + signedToken,
    expires: expiresIn,
  };
}

/**
 * -------------- MIDDLEWARE ----------------
 */

/**
 * This middleware function is used to check if the user is authenticated by checking the JWT token
 */
export const checkAuthenticated = passport.authenticate('jwt', {
  session: false,
});
