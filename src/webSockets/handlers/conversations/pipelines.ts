import { AuthenticatedWebSocket } from '@/webSockets/setup';
import createService from '@/routes/conversationUsers/service';
import convoStore from '@/routes/conversation/store';
import convoUserStore from '@/routes/conversationUsers/store';

const registerPipeline = (
  userClient: AuthenticatedWebSocket,
  clients: Set<AuthenticatedWebSocket>
) => {
  individualPipeline(userClient, clients);

  userClient.on('close', () => {});
};

export default registerPipeline;

// client specific messages
// each client gets an individual instance
const individualPipeline = async (
  userClient: AuthenticatedWebSocket,
  clients: Set<AuthenticatedWebSocket>
) => {
  userClient.on('message', async (message: string) => {
    const data = JSON.parse(message);

    if (userClient.userID && userClient.params?.conversationID) {
      await sendMessageToUsersInConversation(
        userClient,
        parseInt(userClient.params.conversationID),
        clients,
        data.message
      );
    }

    sendMessage(userClient, data.message, 'message', true);
  });
};

const sendMessageToUsersInConversation = async (
  userClient: AuthenticatedWebSocket,
  conversationID: number,
  clients: Set<AuthenticatedWebSocket>,
  message: MessageContent
) => {
  const service = createService(convoStore, convoUserStore);
  if (!userClient.userID) {
    return;
  }

  const users = await service.findUsersInConversation(
    userClient.userID,
    conversationID
  );

  if (!users) {
    return;
  }

  // filter users so that we only send to users who are in clients
  const filteredUsers = users.filter((user) =>
    Array.from(clients).some((client) => client.userID === user.id)
  );

  // send message to filtered users
  for (const client of clients) {
    if (filteredUsers.some((user) => user.id === client.userID)) {
      if (client.id === userClient.id) {
        continue;
      }
      sendMessage(client, message, 'message', true);
    }
  }
};

export type MessageContent = {
  id?: number;
  content: string;
  createdAt: Date;
  userId: number;
  conversationId: number;
};

export const sendMessage = (
  ws: AuthenticatedWebSocket,
  content: string | MessageContent,
  type: 'authenticate' | 'message' | 'info' | 'error' = 'message',
  isValid: boolean = true
) => {
  ws.send(
    JSON.stringify({
      type,
      content,
      isValid,
    })
  );
};
