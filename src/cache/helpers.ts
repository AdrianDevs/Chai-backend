import { RedisClientType } from 'redis';
import RedisClientSingleton from './setup';

// interface StoredRefreshToken {
//   token: string;
//   expiresAt: number;
// }

export class RefreshTokenManager {
  private static REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private static instance: RefreshTokenManager | null = null;
  private client: RedisClientType | null = null;

  private constructor() {}

  public static async getInstance(): Promise<RefreshTokenManager> {
    if (!RefreshTokenManager.instance) {
      RefreshTokenManager.instance = new RefreshTokenManager();
      RefreshTokenManager.instance.client =
        await RedisClientSingleton.getInstance();
    }
    return RefreshTokenManager.instance;
  }

  /**
   * Stores a refresh token in Redis with an expiration
   * @param userId - The user's ID
   * @param refreshToken - The refresh token to store
   * @param expiresIn - Expiration time in milliseconds since epoch
   */
  public async storeRefreshToken(
    userId: string | number,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');

    const key = `${RefreshTokenManager.REFRESH_TOKEN_PREFIX}${userId}`;
    // const tokenData: StoredRefreshToken = {
    //   token: refreshToken,
    //   expiresAt: expiresIn,
    // };

    await this.client.set(key, refreshToken, {
      EX: expiresIn,
    });
  }

  /**
   * Sets the expiration time of a refresh token
   * @param userId - The user's ID
   * @param expiresIn - Expiration time in milliseconds since epoch
   */
  public async setRefreshTokenExpiration(
    userId: string | number,
    expiresIn: number
  ): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');

    const key = `${RefreshTokenManager.REFRESH_TOKEN_PREFIX}${userId}`;
    const token = await this.client.get(key);

    if (!token) {
      throw new Error('Refresh token not found');
    }

    await this.client.set(key, token, {
      EX: expiresIn,
    });
  }

  /**
   * Validates a refresh token and checks if it's expired
   * @param userId - The user's ID
   * @param refreshToken - The refresh token to validate
   * @returns boolean indicating if the token is valid and not expired
   */
  public async validateRefreshToken(
    userId: string | number,
    refreshToken: string
  ): Promise<boolean> {
    if (!this.client) throw new Error('Redis client not initialized');

    const key = `${RefreshTokenManager.REFRESH_TOKEN_PREFIX}${userId}`;
    const token = await this.client.get(key);

    if (!token) {
      return false;
    }

    return token === refreshToken;
  }

  /**
   * Invalidates a refresh token
   * @param userId - The user's ID
   */
  public async invalidateRefreshToken(userId: string | number): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');

    const key = `${RefreshTokenManager.REFRESH_TOKEN_PREFIX}${userId}`;
    await this.client.del(key);
  }

  /**
   * Gets the refresh token for a user
   * @param userId - The user's ID
   * @returns The refresh token
   */
  public async getRefreshToken(
    userId: string | number
  ): Promise<string | null> {
    if (!this.client) throw new Error('Redis client not initialized');

    const key = `${RefreshTokenManager.REFRESH_TOKEN_PREFIX}${userId}`;
    const storedTokenData = await this.client.get(key);

    return storedTokenData;
  }
}
