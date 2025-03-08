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
        console.error('Redis Client Error', err);
      });

      await RedisClientSingleton.client.connect();
    }

    return RedisClientSingleton.client;
  }
}

export default RedisClientSingleton;
