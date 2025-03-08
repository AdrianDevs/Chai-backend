import { AuthServiceInterface } from './controllers';
import { UserStoreInterface } from '@users/service';
import { User } from '@/database/types/user';
import {
  generatePassword,
  issueJWT,
  JwtToken,
  validatePassword,
} from '@/auth/helpers';
import { CustomError } from '@/errors';
import { RefreshTokenManager } from '@/cache/helpers';

class Service implements AuthServiceInterface {
  private store: UserStoreInterface;

  constructor(store: UserStoreInterface) {
    this.store = store;
  }

  public signup = async (username: string, password: string): Promise<User> => {
    const saltHash = generatePassword(password);

    const userExists = await this.store.findUserByUsername(username);
    if (userExists) {
      throw new CustomError(409, 'User already exists');
    }

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const user = await this.store.createUser({
      username,
      password: hash,
      salt,
    });

    // const tokenObject = issueJWT(user);
    return user;
  };

  public login = async (
    username: string,
    password: string
  ): Promise<(User & JwtToken) | undefined> => {
    const user = await this.store.findUserByUsername(username);

    if (!user) {
      return undefined;
    }

    const isValid = validatePassword(password, user.password, user.salt);

    if (!isValid) {
      return undefined;
    }

    const tokenObject = issueJWT(user);

    if (!tokenObject.refreshToken || !tokenObject.refreshTokenExpires) {
      throw new CustomError(500, 'Refresh token not found');
    }

    const refreshTokenManager = await RefreshTokenManager.getInstance();
    await refreshTokenManager.storeRefreshToken(
      user.id,
      tokenObject.refreshToken,
      tokenObject.refreshTokenExpires.getTime()
    );

    return { ...user, ...tokenObject };
  };

  public findUserById = async (id: number): Promise<User | undefined> => {
    return await this.store.findUserById(id);
  };

  public findUserByUsername = async (
    username: string
  ): Promise<User | undefined> => {
    return await this.store.findUserByUsername(username);
  };

  public refreshToken = async (
    userID: number,
    refreshToken: string
  ): Promise<JwtToken> => {
    const refreshTokenManager = await RefreshTokenManager.getInstance();

    const isValid = await refreshTokenManager.validateRefreshToken(
      userID,
      refreshToken
    );

    if (!isValid) {
      throw new CustomError(401, 'Invalid refresh token');
    }

    const user = await this.store.findUserById(userID);

    if (!user) {
      throw new CustomError(404, 'User not found');
    }

    const tokenObject = issueJWT(user);

    if (!tokenObject.refreshToken || !tokenObject.refreshTokenExpires) {
      throw new CustomError(500, 'Refresh token not found');
    }

    await refreshTokenManager.invalidateRefreshToken(userID);
    await refreshTokenManager.storeRefreshToken(
      userID,
      tokenObject.refreshToken,
      tokenObject.refreshTokenExpires.getTime()
    );

    return tokenObject;
  };

  public revokeToken = async (userID: number): Promise<void> => {
    const refreshTokenManager = await RefreshTokenManager.getInstance();
    await refreshTokenManager.invalidateRefreshToken(userID);
  };
}

const createService = (store: UserStoreInterface) => {
  return new Service(store);
};

export default createService;
