import dotenv from 'dotenv';
import { AuthenticatedWebSocket } from './setup';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

type Timeout = ReturnType<typeof setTimeout>;

class PingManager {
  private static instance: PingManager;
  private interval: Timeout | null = null;
  private clients: Set<AuthenticatedWebSocket> = new Set();

  private constructor() {
    // Private constructor to prevent direct construction
    // with the `new` operator
  }

  public static getInstance(): PingManager {
    if (!PingManager.instance) {
      PingManager.instance = new PingManager();
    }
    return PingManager.instance;
  }

  public addClient(client: AuthenticatedWebSocket): void {
    this.clients.add(client);
    if (!this.interval) {
      this.startPingInterval();
    }
  }

  public removeClient(client: AuthenticatedWebSocket): void {
    this.clients.delete(client);
    if (this.clients.size === 0 && this.interval) {
      this.stopPingInterval();
    }
  }

  private startPingInterval(): void {
    let pingInterval = 15000;
    if (process.env.ENV === 'TEST') {
      // eslint-disable-next-line no-console
      console.log(
        '[webSocket][PingManager]: TEST environment detected -> setting ping interval to 1 second'
      );
      pingInterval = 500;
    }

    this.interval = setInterval(() => {
      // eslint-disable-next-line no-console
      console.log(
        '[webSocket][PingManager]: pinging',
        this.clients.size,
        'clients',
        'with interval',
        pingInterval
      );
      for (const client of this.clients) {
        if (client.isAlive === false || client.isAuthenticated === false) {
          // eslint-disable-next-line no-console
          console.log(
            '[webSocket][PingManager]: terminating client',
            client.id,
            'due to inactivity'
          );
          client.terminate();
          continue;
        }
        client.isAlive = false;
        client.ping(() => {});
      }
    }, pingInterval);
  }

  private stopPingInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default PingManager;
