import { AuthenticatedWebSocket } from './setup';

const setupPing = (clients: Set<AuthenticatedWebSocket>) => {
  // eslint-disable-next-line no-console
  console.log(
    '[webSocket][setupPing]: Setting up ping for',
    clients.size,
    'clients'
  );
  const interval = setInterval(() => {
    for (const client of clients) {
      if (client.isAlive === false || client.isAuthenticated === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping(() => {});
      // client.send(`[webSocket][broadcast] ping`);
    }
  }, 15000);

  return interval;
};

export default setupPing;
