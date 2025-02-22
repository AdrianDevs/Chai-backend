import {
  Conversation,
  ConversationUpdate,
  NewConversation,
} from '@/database/types/conversation';
import { ConversationServiceInterface } from './controllers';
import { CustomError } from '@/errors';
import { ConversationUserStoreInterface } from '../conversationUsers/service';

export interface ConversationStoreInterface {
  numberOfConversations: () => Promise<number>;
  createConversation: (
    conversation: NewConversation,
    userIds: number[]
  ) => Promise<Conversation>;
  getConversations: (userId: number) => Promise<Conversation[]>;
  findConversationById: (convoID: number) => Promise<Conversation | undefined>;
  updateConversation: (
    convoID: number,
    updateWith: ConversationUpdate
  ) => Promise<Conversation | undefined>;
  delteConversation: (id: number) => Promise<Conversation | undefined>;
}

class Service implements ConversationServiceInterface {
  private convoStore: ConversationStoreInterface;
  private convoUserStore: ConversationUserStoreInterface;

  constructor(
    convoStore: ConversationStoreInterface,
    convoUserStore: ConversationUserStoreInterface
  ) {
    this.convoStore = convoStore;
    this.convoUserStore = convoUserStore;
  }

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

  public getConversations = async (userId: number): Promise<Conversation[]> => {
    return await this.convoStore.getConversations(userId);
  };

  public findConversationById = async (
    userID: number,
    convoID: number
  ): Promise<Conversation | undefined> => {
    const convo = await this.convoStore.findConversationById(convoID);
    if (!convo) {
      throw new CustomError(404, 'Conversation not found');
    }

    const userInConvo = await this.isUserInConversation(userID, convoID);
    if (!userInConvo) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.convoStore.findConversationById(convoID);
  };

  public createConversation = async (
    conversation: NewConversation,
    userIds: number[]
  ): Promise<Conversation> => {
    return await this.convoStore.createConversation(conversation, userIds);
  };

  public updateConversation = async (
    userID: number,
    convoID: number,
    updateWith: ConversationUpdate
  ): Promise<Conversation | undefined> => {
    const convo = await this.convoStore.findConversationById(convoID);
    if (!convo) {
      throw new CustomError(404, 'Conversation not found');
    }

    const userInConvo = await this.isUserInConversation(userID, convoID);
    if (!userInConvo) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.convoStore.updateConversation(convoID, updateWith);
  };

  public deleteConversation = async (
    userID: number,
    convoID: number
  ): Promise<Conversation | undefined> => {
    const convo = await this.convoStore.findConversationById(convoID);
    if (!convo) {
      throw new CustomError(404, 'Conversation not found');
    }

    const userInConvo = await this.isUserInConversation(userID, convoID);
    if (!userInConvo) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.convoStore.delteConversation(convoID);
  };
}

const createService = (
  convoStore: ConversationStoreInterface,
  convoUserStore: ConversationUserStoreInterface
) => {
  return new Service(convoStore, convoUserStore);
};

export default createService;
