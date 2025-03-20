import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import setupWebSocket from '../setup';

export class TestWebSocketServer {
  private server: Server;
  private wss: WebSocketServer;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.server = createServer();
    // @ts-expect-error - setupWebSocket returns void but we need WebSocketServer
    this.wss = setupWebSocket(this.server);
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Test WebSocket server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        // eslint-disable-next-line no-console
        console.log('Test WebSocket server closed');
        resolve();
      });
    });
  }

  getUrl(): string {
    return `ws://localhost:${this.port}`;
  }
}
