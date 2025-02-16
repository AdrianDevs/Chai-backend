import { Message, MessageUpdate, NewMessage } from '@/database/types/message';
import { ServiceInterface } from './controllers';

export interface StoreInterface {
  getMessages: () => Promise<Message[]>;
  findMessageById: (id: number) => Promise<Message | undefined>;
  findMessages: (criteria: Partial<Message>) => Promise<Message[]>;
  createMessage: (message: NewMessage) => Promise<Message>;
  updateMessage: (id: number, updateWith: MessageUpdate) => Promise<Message>;
  deleteMessage: (id: number) => Promise<Message | undefined>;
}

class Service implements ServiceInterface {
  private store: StoreInterface;

  constructor(store: StoreInterface) {
    this.store = store;
  }

  public getMessages = async (): Promise<Message[]> => {
    return await this.store.getMessages();
  };

  public findMessageById = async (id: number): Promise<Message | undefined> => {
    return await this.store.findMessageById(id);
  };

  public findMessages = async (
    criteria: Partial<Message>
  ): Promise<Message[]> => {
    return await this.store.findMessages(criteria);
  };

  public createMessage = async (message: NewMessage): Promise<Message> => {
    return await this.store.createMessage(message);
  };

  public updateMessage = async (
    id: number,
    updateWith: MessageUpdate
  ): Promise<Message> => {
    return await this.store.updateMessage(id, updateWith);
  };

  public deleteMessage = async (id: number): Promise<Message | undefined> => {
    return await this.store.deleteMessage(id);
  };
}

const createService = (store: StoreInterface) => {
  return new Service(store);
};

export default createService;
