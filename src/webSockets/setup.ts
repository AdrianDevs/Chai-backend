import { Server, WebSocket } from 'ws';
import { getPathAndParams, matchRoute } from './handlers/utils';
import { CustomError } from '@/errors';
import { CacheTokenManager } from '@/cache';
import setupSocketHandlers from './handlers';
import PingManager from './ping';

export type AuthenticatedWebSocket = WebSocket & {
  id: string;
  isAlive: boolean;
  isAuthenticated: boolean;
  params?: Record<string, string>;
  userID?: number;
};

// accepts an http server
const setupWebSocket = (server: Server) => {
  // setup socket handlers
  const socketHandlers = setupSocketHandlers();
  const pingManager = PingManager.getInstance();

  server.on('upgrade', async function upgrade(request, socket, head) {
    try {
      const { path: requestPath, params } = getPathAndParams<{
        token: string;
        userID: string;
      }>(request.url);
      if (!params.token || !params.userID) {
        // eslint-disable-next-line no-console
        console.error('[webSocket]: No token or userId provided');
        throw new CustomError(401, 'No token or userId provided');
      }

      const refreshTokenManager = await CacheTokenManager.getInstance();
      const isValid = await refreshTokenManager.validateWebSocketToken(
        params.userID,
        params.token
      );

      if (!isValid) {
        // eslint-disable-next-line no-console
        console.error('[webSocket]: Invalid token');
        throw new CustomError(401, 'Invalid token');
      }

      // Find matching route handler
      const matchingHandler = socketHandlers.find(({ pattern }) => {
        const routeParams = matchRoute(pattern, requestPath);
        return routeParams !== null;
      });

      if (!matchingHandler) {
        // eslint-disable-next-line no-console
        console.error('[webSocket]: Invalid path');
        throw new CustomError(404, 'Invalid path');
      }

      // Extract route parameters
      const routeParams = matchRoute(matchingHandler.pattern, requestPath);

      matchingHandler.handler.handleUpgrade(
        request,
        socket,
        head,
        function done(ws: WebSocket) {
          // Add route params to the WebSocket instance
          const authenticatedWs = ws as AuthenticatedWebSocket;
          authenticatedWs.params = routeParams || {};
          authenticatedWs.isAlive = true;
          authenticatedWs.isAuthenticated = true;
          authenticatedWs.userID = parseInt(params.userID, 10);

          // Add ping handlers
          authenticatedWs.on('pong', () => {
            authenticatedWs.isAlive = true;
          });

          // Add to ping manager
          pingManager.addClient(authenticatedWs);

          // Clean up on close
          authenticatedWs.on('close', () => {
            pingManager.removeClient(authenticatedWs);
          });

          matchingHandler.handler.emit('connection', ws, request);
        }
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[webSocket]: upgrade exception', err);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
  });
};

export default setupWebSocket;
