import { Message, NewMessage } from '@/database/types/message';
import { ConversationMessageServiceInterface } from './controllers';
import { CustomError } from '@/errors';
import { ConversationUserStoreInterface } from '../conversationUsers/service';
import { ConversationStoreInterface } from '../conversation/service';

export interface ConversationMessageStoreInterface {
  numberOfMessages: () => Promise<number>;
  lastMessageAt: () => Promise<Date | undefined>;
  findMessagesInConversation: (
    userID: number,
    convoID: number,
    limit: number,
    offset: number
  ) => Promise<Message[] | undefined>;
  addMessageToConversation: (
    message: NewMessage
  ) => Promise<Message | undefined>;
}

class Service implements ConversationMessageServiceInterface {
  private convoStore: ConversationStoreInterface;
  private convoUserStore: ConversationUserStoreInterface;
  private convoMsgStore: ConversationMessageStoreInterface;

  constructor(
    convoStore: ConversationStoreInterface,
    convoUserStore: ConversationUserStoreInterface,
    convoMsgStore: ConversationMessageStoreInterface
  ) {
    this.convoStore = convoStore;
    this.convoUserStore = convoUserStore;
    this.convoMsgStore = convoMsgStore;
  }

  private conversationExists = async (id: number): Promise<boolean> => {
    const convo = await this.convoStore.findConversationById(id);
    return !!convo;
  };

  private isUserInConversation = async (
    userID: number,
    convoID: number
  ): Promise<boolean> => {
    const result = await this.convoUserStore.findUserInConversation(
      userID,
      convoID
    );
    return !!result;
  };

  public findMessagesInConversation = async (
    reqUserID: number,
    convoID: number,
    limit: number,
    offset: number
  ): Promise<Message[] | undefined> => {
    if (!(await this.conversationExists(convoID))) {
      throw new CustomError(404, 'Conversation not found');
    }

    if (!(await this.isUserInConversation(reqUserID, convoID))) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.convoMsgStore.findMessagesInConversation(
      reqUserID,
      convoID,
      limit,
      offset
    );
  };

  public addMessageToConversation = async (
    reqUserId: number,
    convoID: number,
    newMessage: NewMessage
  ): Promise<Message | undefined> => {
    if (!(await this.conversationExists(convoID))) {
      throw new CustomError(404, 'Conversation not found');
    }

    if (!(await this.isUserInConversation(newMessage.user_id, convoID))) {
      throw new CustomError(403, 'Forbidden');
    }

    if (reqUserId !== newMessage.user_id) {
      throw new CustomError(403, 'Forbidden');
    }

    if (convoID !== newMessage.conversation_id) {
      throw new CustomError(400, 'Invalid request');
    }

    return await this.convoMsgStore.addMessageToConversation(newMessage);
  };
}

const createService = (
  convoStore: ConversationStoreInterface,
  convoUserStore: ConversationUserStoreInterface,
  convoMsgStore: ConversationMessageStoreInterface
) => {
  return new Service(convoStore, convoUserStore, convoMsgStore);
};

export default createService;
