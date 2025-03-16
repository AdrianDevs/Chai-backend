/* eslint-disable no-console */
import { IncomingMessage } from 'http';
import { Server, WebSocket } from 'ws';
import { AuthenticatedWebSocket } from '../../setup';
import { CustomError } from '@/errors';
import { validateWebSocketToken } from '../utils';
import setupPing from '../../ping';
import registerPipeline from './pipelines';

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
  const wss = new WebSocket.Server({ noServer: true });

  // what to do after a connection is established
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    // print number of active connections
    console.log('[conversationWss]: connected', wss.clients.size);
    console.log('[conversationWss]: conversation params:', ws.params);

    ws.isAuthenticated = false;
    ws.isAlive = true;

    ws.on('pong', () => {
      console.log('[conversationWss]: ping => pong');
      ws.isAlive = true;
    });

    setupPing(wss.clients as Set<AuthenticatedWebSocket>);

    // handle message events
    ws.on('message', (message: string) => {
      console.log(`[conversationWss]: Received data`);

      const data: Data = JSON.parse(message);

      console.log('[conversationWss]: data.message =>', data.message);

      if (data && data.token) {
        try {
          const userID = validateWebSocketToken(data.token);
          if (!userID) {
            console.log(
              '[conversationWss]: authentication failed - invalid JWT token'
            );
            throw new CustomError(401, 'Invalid JWT token');
          }

          console.log('[conversationWss]: valid JWT token -> message is valid');
          ws.isAuthenticated = true;

          if (data.type === 'authenticate') {
            console.log('[conversationWss]: is message to authenticate');
            ws.send(
              JSON.stringify({
                type: 'authenticate',
                message: 'authentication successful',
                isValid: true,
                userID: userID,
              })
            );
            registerPipeline(ws);
          }
        } catch (err) {
          console.log('[conversationWss]: error', err);
          ws.send(
            JSON.stringify({
              type: 'authenticate',
              message: 'authentication failed',
              isValid: false,
            })
          );
          ws.terminate();
        }
      } else {
        console.log(
          '[conversationWss]: authentication failed - message has no token'
        );
        ws.send('[conversationWss] authentication failed');
        ws.terminate();
      }
    });

    // handle close event
    ws.on('close', () => {
      console.log('[conversationWss]: closed', wss.clients.size);
    });

    ws.send('[conversationWss] connection established.');
  });

  return wss;
};

export default conversationWssHandler;
