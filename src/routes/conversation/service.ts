import {
  Conversation,
  ConversationUpdate,
  NewConversation,
} from '@/database/types/conversation';
import { ConversationServiceInterface } from './controllers';
import { CustomError } from '@/errors';
import { ConversationUserServiceInterface } from '../conversationUsers/controllers';

export interface ConversationStoreInterface {
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
  private store: ConversationStoreInterface;
  private convoUserService: ConversationUserServiceInterface;

  constructor(
    store: ConversationStoreInterface,
    convoUserService: ConversationUserServiceInterface
  ) {
    this.store = store;
    this.convoUserService = convoUserService;
  }

  public conversationExists = async (id: number): Promise<boolean> => {
    const convo = await this.store.findConversationById(id);
    return !!convo;
  };

  public getConversations = async (userId: number): Promise<Conversation[]> => {
    return await this.store.getConversations(userId);
  };

  public findConversationById = async (
    userID: number,
    convoID: number
  ): Promise<Conversation | undefined> => {
    const convo = await this.store.findConversationById(convoID);
    if (!convo) {
      throw new CustomError(404, 'Conversation not found');
    }

    const userInConvo = await this.convoUserService.isUserInConversation(
      userID,
      convoID
    );
    if (!userInConvo) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.store.findConversationById(convoID);
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
    const convo = await this.store.findConversationById(convoID);
    if (!convo) {
      throw new CustomError(404, 'Conversation not found');
    }

    const userInConvo = await this.convoUserService.isUserInConversation(
      userID,
      convoID
    );
    if (!userInConvo) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.store.updateConversation(convoID, updateWith);
  };

  public deleteConversation = async (
    userID: number,
    convoID: number
  ): Promise<Conversation | undefined> => {
    const convo = await this.store.findConversationById(convoID);
    if (!convo) {
      throw new CustomError(404, 'Conversation not found');
    }

    const userInConvo = await this.convoUserService.isUserInConversation(
      userID,
      convoID
    );
    if (!userInConvo) {
      throw new CustomError(403, 'Forbidden');
    }

    return await this.store.delteConversation(convoID);
  };
}

const createService = (
  store: ConversationStoreInterface,
  convoUserService: ConversationUserServiceInterface
) => {
  return new Service(store, convoUserService);
};

export default createService;
