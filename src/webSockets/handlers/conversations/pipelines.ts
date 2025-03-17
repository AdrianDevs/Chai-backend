/* eslint-disable no-console */
import { AuthenticatedWebSocket } from '@/webSockets/setup';
import createService from '@/routes/conversationUsers/service';
import convoStore from '@/routes/conversation/store';
import convoUserStore from '@/routes/conversationUsers/store';

const registerPipeline = (
  userClient: AuthenticatedWebSocket,
  clients: Set<AuthenticatedWebSocket>
) => {
  console.log('[webSocket][onRegister]: onRegister');

  individualPipeline(userClient, clients);

  userClient.on('close', () => {
    console.log('[webSocket][onRegister]: connection closed');
  });
};

export default registerPipeline;

// client specific messages
// each client gets an individual instance
const individualPipeline = async (
  userClient: AuthenticatedWebSocket,
  clients: Set<AuthenticatedWebSocket>
) => {
  console.log('[webSocket][individual]: Individual pipeline');

  userClient.on('message', async (message: string) => {
    const data = JSON.parse(message);
    console.log('[webSocket][individual]: message received:', data.message);
    console.log('[webSocket][individual]: userID', userClient.userID);
    console.log('[webSocket][individual]: params', userClient.params);

    if (userClient.userID && userClient.params?.conversationID) {
      await sendMessageToUsersInConversation(
        userClient.userID,
        parseInt(userClient.params.conversationID),
        clients,
        data.message
      );
    }

    sendMessage(userClient, data.message, 'message', true);
  });
};

const sendMessageToUsersInConversation = async (
  userID: number,
  conversationID: number,
  clients: Set<AuthenticatedWebSocket>,
  message: MessageContent
) => {
  const service = createService(convoStore, convoUserStore);
  const users = await service.findUsersInConversation(userID, conversationID);

  if (!users) {
    return;
  }

  // filter users so that we only send to users who are in clients
  const allFilteredUsers = users.filter((user) =>
    Array.from(clients).some((client) => client.userID === user.id)
  );

  // filter out the userID that is sending the message
  const filteredUsers = allFilteredUsers.filter((user) => user.id !== userID);

  console.log(
    '[webSocket][sendMessageToUsersInConversation]: filteredUsers',
    filteredUsers
  );

  // send message to filtered users
  for (const user of filteredUsers) {
    const client = Array.from(clients).find(
      (client) => client.userID === user.id
    );
    if (client) {
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
