import {
  Conversation,
  ConversationUpdate,
  NewConversation,
} from '@/database/types/conversation';
import { ConversationServiceInterface } from './controllers';

export interface ConversationStoreInterface {
  createConversation: (
    conversation: NewConversation,
    userIds: number[]
  ) => Promise<Conversation>;
  getConversations: (userId: number) => Promise<Conversation[]>;
  findConversationById: (
    userID: number,
    convoID: number
  ) => Promise<Conversation | undefined>;
  updateConversation: (
    convoID: number,
    updateWith: ConversationUpdate
  ) => Promise<Conversation | undefined>;
  delteConversation: (id: number) => Promise<Conversation | undefined>;
}

class Service implements ConversationServiceInterface {
  private store: ConversationStoreInterface;

  constructor(store: ConversationStoreInterface) {
    this.store = store;
  }

  public getConversations = async (userId: number): Promise<Conversation[]> => {
    return await this.store.getConversations(userId);
  };

  public findConversationById = async (
    userID: number,
    convoID: number
  ): Promise<Conversation | undefined> => {
    return await this.store.findConversationById(userID, convoID);
  };

  public createConversation = async (
    conversation: NewConversation,
    userIds: number[]
  ): Promise<Conversation> => {
    return await this.store.createConversation(conversation, userIds);
  };

  public updateConversation = async (
    userID: number,
    convoID: number,
    updateWith: ConversationUpdate
  ): Promise<Conversation | undefined> => {
    const convo = await this.store.findConversationById(userID, convoID);
    if (!convo) {
      return undefined;
    }

    return await this.store.updateConversation(convo.id, updateWith);
  };

  public deleteConversation = async (
    userID: number,
    convoID: number
  ): Promise<Conversation | undefined> => {
    const convo = await this.store.findConversationById(userID, convoID);
    if (!convo) {
      return undefined;
    }

    return await this.store.delteConversation(convoID);
  };
}

const createService = (store: ConversationStoreInterface) => {
  return new Service(store);
};

export default createService;
