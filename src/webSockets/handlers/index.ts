import { IncomingMessage } from 'http';
import conversationWssHandler from './conversations/conversations';
import { Server, WebSocket } from 'ws';

interface RouteHandler {
  pattern: string;
  handler: Server<typeof WebSocket, typeof IncomingMessage>;
}

const setupSocketHandlers = (): RouteHandler[] => {
  return [
    {
      pattern: '/conversations/:conversationID',
      handler: conversationWssHandler(),
    },
    // Add more route handlers here as needed
  ];
};

export default setupSocketHandlers;
