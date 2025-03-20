import { TokenObject } from '../../auth/helpers';
import { User } from '../../database/types/user';
import createAuthService from '../../routes/auth/service';
import userStore from '../../routes/users/store';
import { db } from '../../database/database';
import { CacheTokenManager } from '../../cache/helpers';
import { AuthServiceInterface } from '../../routes/auth/controllers';

class TestUserManager {
  private usernamePrefix: string;
  private authService: AuthServiceInterface;
  private userIDs: number[] = [];

  public constructor(usernamePrefix: string = 'test-user-') {
    this.usernamePrefix = usernamePrefix;
    this.authService = createAuthService(userStore);
  }

  public createTestUser = async (
    username?: string,
    password?: string
  ): Promise<User> => {
    if (!username) {
      username = `${this.usernamePrefix}-${Math.random().toString(36).substring(2, 15)}`;
    }
    if (!password) {
      password = 'password';
    }

    const user = await this.authService.signup(username, password);
    this.userIDs.push(user.id);
    return user;
  };

  public loginUser = async (
    user: User,
    password?: string
  ): Promise<TokenObject> => {
    if (!password) {
      password = 'password';
    }
    const tokens = await this.authService.login(user.username, password);
    if (!tokens) {
      throw new Error('Failed to create test tokens');
    }
    return {
      token: tokens.token,
      expiryDate: tokens.expiryDate,
      expiryEpoch: tokens.expiryEpoch,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiryDate: tokens.refreshTokenExpiryDate,
      refreshTokenExpiryEpoch: tokens.refreshTokenExpiryEpoch,
      refreshTokenExpiresInSeconds: tokens.refreshTokenExpiresInSeconds,
      webSocketToken: tokens.webSocketToken,
      webSocketTokenExpiryDate: tokens.webSocketTokenExpiryDate,
      webSocketTokenExpiryEpoch: tokens.webSocketTokenExpiryEpoch,
      webSocketTokenExpiresInSeconds: tokens.webSocketTokenExpiresInSeconds,
    };
  };

  public deleteUsers = async () => {
    if (this.userIDs && this.userIDs.length > 0) {
      for (const userID of this.userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
        const refreshTokenManager = await CacheTokenManager.getInstance();
        refreshTokenManager.invalidateRefreshToken(userID);
        refreshTokenManager.invalidateWebSocketToken(userID);
      }
    }
  };
}

export default TestUserManager;
