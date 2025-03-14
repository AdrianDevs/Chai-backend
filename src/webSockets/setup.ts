/* eslint-disable no-console */
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verify } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import individualPipeline, { broadcastPipeline } from './pipeline';
import { getPathAndParams } from './utils';

// accepts an http server (covered later)
function setupWebSocket(server: Server) {
  // ws instance
  const wss = new WebSocket.Server({ noServer: true });

  broadcastPipeline(wss.clients);

  // handle upgrade of the request
  server.on('upgrade', function upgrade(request, socket, head) {
    try {
      console.log('[webSocket]: upgrade');

      const { path: pathValue, params } = getPathAndParams(request.url);
      console.log('[webSocket]: path', pathValue);
      console.log('[webSocket]: params', params);

      if (!params.token) {
        throw new Error('No token provided');
      }

      const pathToPublicKey = path.join(
        __dirname,
        '../../keys',
        'jwt_public.key'
      );
      const PUB_KEY = fs.readFileSync(pathToPublicKey, 'utf8');
      const jwtPayload = verify(params.token, PUB_KEY);

      if (!jwtPayload) {
        throw new Error('Invalid token');
      }

      console.log('[webSocket]: jwtPayload', jwtPayload);

      wss.handleUpgrade(request, socket, head, function done(ws: WebSocket) {
        console.log('[webSocket]: handleUpgrade');
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.log('[webSocket]: upgrade exception', err);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
  });

  // what to do after a connection is established
  wss.on('connection', (ws: WebSocket) => {
    // print number of active connections
    console.log('[webSocket]: connected', wss.clients.size);

    const interval = individualPipeline(ws);

    // handle message events
    // receive a message and echo it back
    ws.on('message', (message: string) => {
      console.log(`[webSocket]: Received message => ${message}`);
      ws.send(`[webSocket] you said ${message}`);
    });

    // handle close event
    ws.on('close', () => {
      console.log('[webSocket]: closed', wss.clients.size);
      clearInterval(interval);
    });

    // sent a message that we're good to proceed
    ws.send('[webSocket] connection established.');
  });
}

export default setupWebSocket;
