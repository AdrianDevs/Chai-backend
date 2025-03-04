import { NewUser, User } from '@/database/types/user';
import { UserServiceInterface } from './controllers';

export interface UserStoreInterface {
  numberOfUsers: () => Promise<number>;
  createUser: (user: NewUser) => Promise<User>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
  findUsersByUsernames: (username: string[]) => Promise<Array<User>>;
  updateUser: (id: number, updateWith: Partial<User>) => Promise<User>;
  deleteUser: (id: number) => Promise<User | undefined>;
}

class Service implements UserServiceInterface {
  private store: UserStoreInterface;

  constructor(store: UserStoreInterface) {
    this.store = store;
  }

  public findUserById = async (id: number): Promise<User | undefined> => {
    return await this.store.findUserById(id);
  };

  public findUserByUsername = async (
    username: string
  ): Promise<User | undefined> => {
    return await this.store.findUserByUsername(username);
  };

  public findUsersByUsernames = async (
    usernames: string[]
  ): Promise<User[]> => {
    const users = await this.store.findUsersByUsernames(usernames);
    return users.filter((user) => user !== undefined) as User[];
  };

  public deleteUser = async (id: number): Promise<User | undefined> => {
    return await this.store.deleteUser(id);
  };
}

const createService = (store: UserStoreInterface) => {
  return new Service(store);
};

export default createService;
