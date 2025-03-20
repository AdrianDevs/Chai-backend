/* eslint-disable no-console */
import { IncomingMessage } from 'http';
import { Server, WebSocket, WebSocketServer } from 'ws';
import { AuthenticatedWebSocket } from '../../setup';
import { CustomError } from '@/errors';
import { validateWebSocketToken } from '../utils';
import registerPipeline, { sendMessage } from './pipelines';

type Data = {
  token: string;
  type: 'authenticate' | 'message';
  message?: string;
};

const conversationWssHandler = (): Server<
  typeof WebSocket,
  typeof IncomingMessage
> => {
  console.log('[conversationWss]: conversationWssHandler initialized');
  const wss = new WebSocketServer({ noServer: true });
  // const pingManager = PingManager.getInstance();

  // what to do after a connection is established
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    // print number of active connections
    console.log('[conversationWss]: <== connected user', ws.userID);
    console.log('[conversationWss]: conversation params:', ws.params);
    console.log('[conversationWss]: total clients connected', wss.clients.size);
    console.log('-----------------------------------------------------');

    ws.isAuthenticated = false;
    ws.isAlive = true;

    ws.on('pong', () => {
      console.log('[conversationWss]: pong received');
      ws.isAlive = true;
    });

    // Add client to ping manager
    // pingManager.addClient(ws);

    // handle message events
    ws.on('message', (message: string) => {
      console.log(`[conversationWss]: Received data`);

      const data: Data = JSON.parse(message);

      console.log('[conversationWss]: data.message =>', data.message);
      console.log(
        '[conversationWss]: is client authenticated =>',
        ws.isAuthenticated
      );

      if (
        !ws.isAuthenticated &&
        data &&
        data.type === 'authenticate' &&
        data.token
      ) {
        console.log('[conversationWss]: is message to authenticate');
        try {
          const userID = validateWebSocketToken(data.token);
          if (!userID) {
            console.log(
              '[conversationWss]: authentication failed - invalid JWT token'
            );
            throw new CustomError(401, 'Invalid JWT token');
          }

          console.log(
            '[conversationWss]: valid JWT token -> set user as authenticated'
          );
          ws.userID = userID;
          ws.isAuthenticated = true;
          sendMessage(ws, 'authentication successful', 'authenticate', true);
          registerPipeline(ws, wss.clients as Set<AuthenticatedWebSocket>);
        } catch (err) {
          console.log('[conversationWss]: authentication failed', err);
          sendMessage(ws, 'authentication failed', 'error', false);
          ws.terminate();
        }
      } else if (!ws.isAuthenticated) {
        console.log(
          '[conversationWss]: is message to send but not authenticated'
        );
        sendMessage(ws, 'not authenticated', 'error', false);
        ws.terminate();
      } else if (ws.isAuthenticated && data && data.type === 'message') {
        console.log('[conversationWss]: is message to send');
      } else {
        console.log('[conversationWss]: unknown message type');
        sendMessage(ws, 'unknown message type', 'error', false);
        ws.terminate();
      }
    });

    // handle close event
    ws.on('close', () => {
      console.log(
        '[conversationWss]: ==> connection closed for user',
        ws.userID
      );
      console.log(
        '[conversationWss]: closed -> clients remaining:',
        wss.clients.size
      );
      // Remove client from ping manager
      // pingManager.removeClient(ws);
    });

    sendMessage(ws, 'connection established', 'info', true);
  });

  return wss;
};

export default conversationWssHandler;
