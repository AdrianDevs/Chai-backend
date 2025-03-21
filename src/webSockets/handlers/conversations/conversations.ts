import { IncomingMessage } from 'http';
import { Server, WebSocket, WebSocketServer } from 'ws';
import { AuthenticatedWebSocket } from '../../setup';
import { CustomError } from '@/errors';
import { validateWebSocketToken } from '../utils';
import registerPipeline, { sendMessage } from './pipelines';
import { v4 as uuidv4 } from 'uuid';

type Data = {
  token: string;
  type: 'authenticate' | 'message';
  message?: string;
};

const conversationWssHandler = (): Server<
  typeof WebSocket,
  typeof IncomingMessage
> => {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.isAuthenticated = false;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // handle message events
    ws.on('message', (message: string) => {
      const data: Data = JSON.parse(message);

      if (
        !ws.isAuthenticated &&
        data &&
        data.type === 'authenticate' &&
        data.token
      ) {
        try {
          const userID = validateWebSocketToken(data.token);
          if (!userID) {
            // eslint-disable-next-line no-console
            console.error(
              '[conversationWss]: authentication failed - invalid JWT token'
            );
            throw new CustomError(401, 'Invalid JWT token');
          }

          ws.id = uuidv4();
          ws.userID = userID;
          ws.isAuthenticated = true;
          sendMessage(ws, 'authentication successful', 'authenticate', true);
          registerPipeline(ws, wss.clients as Set<AuthenticatedWebSocket>);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[conversationWss]: authentication failed', err);
          sendMessage(ws, 'authentication failed', 'error', false);
          ws.terminate();
        }
      } else if (!ws.isAuthenticated) {
        // eslint-disable-next-line no-console
        console.error(
          '[conversationWss]: is message to send but not authenticated'
        );
        sendMessage(ws, 'not authenticated', 'error', false);
        ws.terminate();
      } else if (data && data.type !== 'message') {
        // eslint-disable-next-line no-console
        console.error('[conversationWss]: unknown message type');
        sendMessage(ws, 'unknown message type', 'error', false);
        ws.terminate();
      }
      // If we got this far, we have a valid message
      // and the user is authenticated
    });

    // handle close event
    ws.on('close', () => {});

    sendMessage(ws, 'connection established', 'info', true);
  });

  return wss;
};

export default conversationWssHandler;
