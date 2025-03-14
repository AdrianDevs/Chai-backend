import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verify } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

interface WebSocketPayload {
  message?: string;
  userId?: string;
  [key: string]: unknown;
}

class WebSocketServer {
  private wss: Server;
  private clients: Map<string, Set<AuthenticatedWebSocket>>;
  private heartbeatInterval: ReturnType<typeof setInterval>;

  constructor(server: Server) {
    // eslint-disable-next-line no-console
    console.log('[webSocket]: Constructor');
    this.wss = new Server({ noServer: true });
    this.clients = new Map();
    this.heartbeatInterval = setInterval(() => this.checkHeartbeat(), 30000); // Check every 30 seconds
    this.setupWebSocket();
  }

  private setupWebSocket() {
    // eslint-disable-next-line no-console
    console.log('[webSocket]: Setup WebSocket');
    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      // eslint-disable-next-line no-console
      console.log('[webSocket]: Connection');
      try {
        // Initialize heartbeat
        const authenticatedWs = ws as AuthenticatedWebSocket;
        authenticatedWs.isAlive = true;
        authenticatedWs.on('pong', () => {
          authenticatedWs.isAlive = true;
        });

        // Authenticate connection
        const token = this.extractToken(req);
        if (!token) {
          // eslint-disable-next-line no-console
          console.log('[webSocket]: No token');
          ws.close(1008, 'Authentication required');
          return;
        }
        // eslint-disable-next-line no-console
        console.log('[webSocket]: Token:', token);

        const userId = await this.authenticateConnection(token);
        if (!userId) {
          // eslint-disable-next-line no-console
          console.log('[webSocket]: Invalid token');
          ws.close(1008, 'Invalid token');
          return;
        }

        // Store client connection
        authenticatedWs.userId = userId;
        this.addClient(userId, authenticatedWs);

        // Handle messages
        ws.on('message', (message: string) =>
          this.handleMessage(authenticatedWs, message)
        );

        // Handle disconnection
        ws.on('close', () => this.handleDisconnect(authenticatedWs));

        // Handle errors
        ws.on('error', (error) => this.handleError(authenticatedWs, error));

        // Send welcome message
        this.sendToClient(authenticatedWs, {
          type: 'connection_established',
          payload: { userId },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('[webSocket]: Error:', error);
        // eslint-disable-next-line no-console
        console.error('WebSocket connection error:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  private extractToken(req: IncomingMessage): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return null;

    return token;
  }

  private async authenticateConnection(token: string): Promise<string | null> {
    try {
      const pathToPublicKey = path.join(
        __dirname,
        '../../keys',
        'jwt_public.key'
      );
      const PUB_KEY = fs.readFileSync(pathToPublicKey, 'utf8');
      const decoded = verify(token, PUB_KEY, { algorithms: ['RS256'] }) as {
        sub: string;
      };
      return decoded.sub;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('WebSocket authentication error:', error);
      return null;
    }
  }

  private addClient(userId: string, ws: AuthenticatedWebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)?.add(ws);
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: string) {
    try {
      // eslint-disable-next-line no-console
      console.log('[webSocket]: Handle message');
      const parsedMessage: WebSocketMessage = JSON.parse(message);
      // Handle different message types here
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error handling message:', error);
      this.sendToClient(ws, {
        type: 'error',
        payload: { message: 'Invalid message format' },
      });
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    this.removeClient(ws);
    // eslint-disable-next-line no-console
    console.log(`Client disconnected: ${ws.userId}`);
  }

  private handleError(ws: AuthenticatedWebSocket, error: Error) {
    // eslint-disable-next-line no-console
    console.error(`WebSocket error for client ${ws.userId}:`, error);
    this.removeClient(ws);
  }

  private checkHeartbeat() {
    this.wss.clients.forEach((ws) => {
      const authenticatedWs = ws as AuthenticatedWebSocket;
      if (!authenticatedWs.isAlive) {
        // eslint-disable-next-line no-console
        console.log(`Client ${authenticatedWs.userId} timed out`);
        return ws.terminate();
      }
      authenticatedWs.isAlive = false;
    });
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Public methods for sending messages
  public sendToUser(userId: string, message: WebSocketMessage) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach((client) => this.sendToClient(client, message));
    }
  }

  public broadcast(message: WebSocketMessage, excludeUserId?: string) {
    this.wss.clients.forEach((ws) => {
      const authenticatedWs = ws as AuthenticatedWebSocket;
      if (authenticatedWs.userId && authenticatedWs.userId !== excludeUserId) {
        this.sendToClient(authenticatedWs, message);
      }
    });
  }

  public close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}

export default function setupWebSocket(server: Server): WebSocketServer {
  return new WebSocketServer(server);
}
