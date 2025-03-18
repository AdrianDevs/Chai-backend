/* eslint-disable no-console */
import { AuthenticatedWebSocket } from './setup';

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
    console.log('[webSocket][PingManager]: starting ping interval');
    const uniqueIntervalName = `ping-${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    this.interval = setInterval(() => {
      console.log(
        `[webSocket][PingManager][${uniqueIntervalName}]: pinging`,
        this.clients.size,
        'clients'
      );
      for (const client of this.clients) {
        console.log(
          `[webSocket][PingManager][${uniqueIntervalName}]: pinging client`,
          client.userID
        );
        if (client.isAlive === false || client.isAuthenticated === false) {
          console.log(
            `[webSocket][PingManager][${uniqueIntervalName}]: terminating client`,
            client.userID,
            'due to inactivity'
          );
          client.terminate();
          continue;
        }
        client.isAlive = false;
        client.ping(() => {});
      }
    }, 15000);
  }

  private stopPingInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default PingManager;
