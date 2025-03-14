/* eslint-disable no-console */
import { WebSocket } from 'ws';

// client specific messages
// each client gets an individual instance
export function individualPipeline(client: WebSocket) {
  console.log('[webSocket]: Individual pipeline');

  let idx = 0;
  const interval = setInterval(() => {
    console.log('[webSocket]: Sending to client');
    client.send(`[webSocket] individual pong ${idx}`);
    idx++;
  }, 10000);

  return interval;
}

export default individualPipeline;

// broadcast messages
// one instance for all clients
export function broadcastPipeline(clients: Set<WebSocket>) {
  console.log('[webSocket]: Broadcast pipeline for', clients.size, 'clients');

  let idx = 0;
  const interval = setInterval(() => {
    clients.forEach((client) => {
      console.log('[webSocket]: Broadcasting to all', clients.size, 'clients');
      client.send(`[webSocket] broadcast ping ${idx}`);
    });
    idx++;
  }, 10000);

  return interval;
}
