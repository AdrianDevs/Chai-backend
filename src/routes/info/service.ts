import { UserStoreInterface } from '../users/service';
import { ConversationStoreInterface } from '../conversation/service';
import { ConversationMessageStoreInterface } from '../conversationMessages/service';
import { InfoServiceInterface } from './controllers';
import { Info } from './types';

class Service implements InfoServiceInterface {
  private userStore: UserStoreInterface;
  private convoStore: ConversationStoreInterface;
  private convoMessageStore: ConversationMessageStoreInterface;

  constructor(
    userStore: UserStoreInterface,
    convoStore: ConversationStoreInterface,
    convoMessageStore: ConversationMessageStoreInterface
  ) {
    this.userStore = userStore;
    this.convoStore = convoStore;
    this.convoMessageStore = convoMessageStore;
  }

  public findInfo = async (): Promise<Info> => {
    const title = 'Chai API';
    const description = 'RESTful API for the Chai chat app';
    const version = '1.0.0';
    const license = {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    };

    const numOfUsers = await this.userStore.numberOfUsers();
    const numOfConversations = await this.convoStore.numberOfConversations();
    const numOfMessages = await this.convoMessageStore.numberOfMessages();
    const lastMessageAt = await this.convoMessageStore.lastMessageAt();

    return {
      title,
      description,
      version,
      license,
      numOfUsers,
      numOfConversations,
      numOfMessages,
      lastMessageAt: lastMessageAt?.toISOString() || '',
    };
  };
}

const createService = (
  userStore: UserStoreInterface,
  convoStore: ConversationStoreInterface,
  convoMessageStore: ConversationMessageStoreInterface
) => {
  return new Service(userStore, convoStore, convoMessageStore);
};

export default createService;
