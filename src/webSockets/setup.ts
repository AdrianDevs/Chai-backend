/* eslint-disable no-console */
import { Server, WebSocket } from 'ws';
import { getPathAndParams, matchRoute } from './handlers/utils';
import { CustomError } from '@/errors';
import { CacheTokenManager } from '@/cache';
import setupSocketHandlers from './handlers';

export type AuthenticatedWebSocket = WebSocket & {
  isAlive: boolean;
  isAuthenticated: boolean;
  params?: Record<string, string>;
  userID?: number;
};

// accepts an http server
const setupWebSocket = (server: Server) => {
  console.log('[webSocket]: setupWebSocket');

  // setup socket handlers
  const socketHandlers = setupSocketHandlers();

  server.on('upgrade', async function upgrade(request, socket, head) {
    try {
      console.log('[webSocket]: upgrade');

      const { path: requestPath, params } = getPathAndParams<{
        token: string;
        userID: string;
      }>(request.url);
      console.log('[webSocket]: path', requestPath);
      console.log('[webSocket]: params', params);

      if (!params.token || !params.userID) {
        throw new CustomError(401, 'No token or userId provided');
      }

      const refreshTokenManager = await CacheTokenManager.getInstance();
      const isValid = await refreshTokenManager.validateWebSocketToken(
        params.userID,
        params.token
      );

      if (!isValid) {
        throw new CustomError(401, 'Invalid token');
      }

      // Find matching route handler
      const matchingHandler = socketHandlers.find(({ pattern }) => {
        const routeParams = matchRoute(pattern, requestPath);
        return routeParams !== null;
      });

      if (!matchingHandler) {
        throw new CustomError(404, 'Invalid path');
      }

      // Extract route parameters
      const routeParams = matchRoute(matchingHandler.pattern, requestPath);
      console.log('[webSocket]: routeParams', routeParams);

      matchingHandler.handler.handleUpgrade(
        request,
        socket,
        head,
        function done(ws: WebSocket) {
          console.log('[webSocket]: handleUpgrade');
          // Add route params to the WebSocket instance
          (ws as AuthenticatedWebSocket).params = routeParams || {};
          matchingHandler.handler.emit('connection', ws, request);
        }
      );
    } catch (err) {
      console.log('[webSocket]: upgrade exception', err);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
  });
};

export default setupWebSocket;
