import { AuthServiceInterface } from './controllers';
import { UserStoreInterface } from '@users/service';
import { User } from '@/database/types/user';
import {
  generateHashToken,
  generatePassword,
  HashTokenObject,
  issueTokens,
  TokenObject,
  TokenType,
  validatePassword,
} from '@/auth/helpers';
import { CustomError } from '@/errors';
import { CacheTokenManager } from '@/cache/helpers';

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
  ): Promise<(User & TokenObject) | undefined> => {
    const user = await this.store.findUserByUsername(username);

    if (!user) {
      return undefined;
    }

    const isValid = validatePassword(password, user.password, user.salt);

    if (!isValid) {
      return undefined;
    }

    const tokenObject = issueTokens(user);
    const refreshTokenManager = await CacheTokenManager.getInstance();

    await refreshTokenManager.storeRefreshToken(
      user.id,
      tokenObject.refreshToken,
      tokenObject.refreshTokenExpiresInSeconds
    );
    await refreshTokenManager.storeWebSocketToken(
      user.id,
      tokenObject.webSocketToken,
      tokenObject.webSocketTokenExpiresInSeconds
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

  public refreshTokens = async (
    userID: number,
    refreshToken: string
  ): Promise<TokenObject> => {
    const refreshTokenManager = await CacheTokenManager.getInstance();

    const isValid = await refreshTokenManager.validateRefreshToken(
      userID,
      refreshToken
    );
    if (!isValid) {
      refreshTokenManager.invalidateRefreshToken(userID);
      refreshTokenManager.invalidateWebSocketToken(userID);
      throw new CustomError(401, 'Invalid refresh token');
    }

    const user = await this.store.findUserById(userID);
    if (!user) {
      throw new CustomError(404, 'User not found');
    }

    const tokenObject = issueTokens(user);

    await refreshTokenManager.invalidateRefreshToken(userID);
    await refreshTokenManager.storeRefreshToken(
      userID,
      tokenObject.refreshToken,
      tokenObject.refreshTokenExpiresInSeconds
    );
    await refreshTokenManager.storeWebSocketToken(
      userID,
      tokenObject.webSocketToken,
      tokenObject.webSocketTokenExpiresInSeconds
    );

    return tokenObject;
  };

  public revokeTokens = async (userID: number): Promise<void> => {
    const refreshTokenManager = await CacheTokenManager.getInstance();
    await refreshTokenManager.invalidateRefreshToken(userID);
    await refreshTokenManager.invalidateWebSocketToken(userID);
  };

  public generateWebSocketToken = async (
    userID: number
  ): Promise<HashTokenObject> => {
    const tokenObject = generateHashToken(userID, TokenType.WEBSOCKET);
    const refreshTokenManager = await CacheTokenManager.getInstance();
    await refreshTokenManager.storeWebSocketToken(
      userID,
      tokenObject.token,
      tokenObject.expiresInSeconds
    );
    return tokenObject;
  };
}

const createService = (store: UserStoreInterface) => {
  return new Service(store);
};

export default createService;
