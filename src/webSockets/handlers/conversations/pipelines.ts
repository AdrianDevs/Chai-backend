/* eslint-disable no-console */
import { WebSocket } from 'ws';

const registerPipeline = (client: WebSocket) => {
  console.log('[webSocket][onRegister]: onRegister');

  individualPipeline(client);

  client.on('close', () => {
    console.log('[webSocket][onRegister]: connection closed');
  });
};

// client specific messages
// each client gets an individual instance
const individualPipeline = (client: WebSocket) => {
  console.log('[webSocket][individual]: Individual pipeline');

  client.on('message', (message: string) => {
    const data = JSON.parse(message);
    console.log('[webSocket][individual]: message', data.message);
    client.send(`echo ${data.message}`);
  });
};

export default registerPipeline;
