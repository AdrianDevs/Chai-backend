import { createClient, RedisClientType } from 'redis';

class RedisClientSingleton {
  private static client: RedisClientType | null = null;

  private constructor() {}

  public static async getInstance(): Promise<RedisClientType> {
    if (!RedisClientSingleton.client) {
      RedisClientSingleton.client = createClient({
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      });

      RedisClientSingleton.client.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('[redis]: Redis Client Error', err.message);
      });

      RedisClientSingleton.client.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log('[redis]: Redis Client Connected');
      });

      RedisClientSingleton.client.on('ready', () => {
        // eslint-disable-next-line no-console
        console.log('[redis]: Redis Client Ready');
      });

      RedisClientSingleton.client.on('reconnecting', () => {
        // eslint-disable-next-line no-console
        console.log('[redis]: Redis Client Reconnecting');
      });

      RedisClientSingleton.client.on('end', () => {
        // eslint-disable-next-line no-console
        console.log('[redis]: Redis Client Ended');
      });

      await RedisClientSingleton.client.connect();
    }

    return RedisClientSingleton.client;
  }
}

export default RedisClientSingleton;
