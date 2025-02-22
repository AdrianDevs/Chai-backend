import { Conversation, ConversationUser } from '@/database/types/conversation';
import { User } from '@/database/types/user';
import { ConversationUserServiceInterface } from './controllers';
import { CustomError } from '@/errors';

export interface ConversationUserStoreInterface {
  findConversationById: (convoID: number) => Promise<Conversation | undefined>;
  findUserInConversation: (
    userID: number,
    convoID: number
  ) => Promise<(User & ConversationUser) | undefined>;
  findUsersInConversation: (
    convoID: number
  ) => Promise<(User & ConversationUser)[] | undefined>;
  addUserToConversation: (
    userID: number,
    convoID: number
  ) => Promise<ConversationUser | undefined>;
  removeUserFromConversation: (
    userID: number,
    convoID: number
  ) => Promise<ConversationUser | undefined>;
}

class Service implements ConversationUserServiceInterface {
  private store: ConversationUserStoreInterface;

  constructor(store: ConversationUserStoreInterface) {
    this.store = store;
  }

  public conversationExists = async (id: number): Promise<boolean> => {
    const convo = await this.store.findConversationById(id);
    return !!convo;
  };

  public isUserInConversation = async (
    userID: number,
    convoID: number
  ): Promise<boolean> => {
    const result = await this.store.findUserInConversation(userID, convoID);
    return !!result;
  };

  public findUsersInConversation = async (
    userID: number,
    convoID: number
  ): Promise<{ id: number; username: string }[] | undefined> => {
    if (!(await this.conversationExists(convoID))) {
      throw new CustomError(404, 'Conversation not found');
    }

    if (!(await this.isUserInConversation(userID, convoID))) {
      throw new CustomError(403, 'Forbidden');
    }

    const result = await this.store.findUsersInConversation(convoID);
    if (!result) {
      return undefined;
    }
    if (result.length === 0) {
      return [];
    }

    if (!result.some((user) => user.user_id === userID)) {
      throw new CustomError(403, 'Forbidden');
    }

    return result.map((user) => {
      return {
        id: user.id,
        username: user.username,
      };
    });
  };

  public addUserToConversation = async (
    userID: number,
    convoID: number,
    userToAddID: number
  ): Promise<ConversationUser | undefined> => {
    if (!(await this.conversationExists(convoID))) {
      throw new CustomError(404, 'Conversation not found');
    }

    if (!(await this.isUserInConversation(userID, convoID))) {
      throw new CustomError(403, 'Forbidden');
    }

    if (await this.isUserInConversation(userToAddID, convoID)) {
      throw new CustomError(400, 'User to be added is already in conversation');
    }

    return await this.store.addUserToConversation(userToAddID, convoID);
  };

  public removeUserFromConversation = async (
    userID: number,
    convoID: number,
    userToRemoveID: number
  ): Promise<ConversationUser | undefined> => {
    if (!(await this.conversationExists(convoID))) {
      throw new CustomError(404, 'Conversation not found');
    }

    if (!(await this.isUserInConversation(userID, convoID))) {
      throw new CustomError(403, 'Forbidden');
    }

    if (!(await this.isUserInConversation(userToRemoveID, convoID))) {
      throw new CustomError(400, 'User to be removed is not in conversation');
    }

    return await this.store.removeUserFromConversation(userToRemoveID, convoID);
  };
}

const createService = (store: ConversationUserStoreInterface) => {
  return new Service(store);
};

export default createService;
