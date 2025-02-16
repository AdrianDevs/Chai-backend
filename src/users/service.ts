import bcrypt from 'bcryptjs';
import { UserServiceInterface } from './controllers';
import { NewUser, User } from '@/database/types/user';

export interface StoreInterface {
  createUser: (user: NewUser) => Promise<User>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
  findUserByUsernameAndPassword: (
    username: string,
    password: string
  ) => Promise<User | undefined>;
  updateUser: (id: number, updateWith: Partial<User>) => Promise<User>;
  deleteUser: (id: number) => Promise<User | undefined>;
}

class Service implements UserServiceInterface {
  private store: StoreInterface;

  constructor(store: StoreInterface) {
    // eslint-disable-next-line no-console
    console.log('CONSTRUCT USER STORE');
    this.store = store;
  }

  public signup = async (username: string, password: string): Promise<User> => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.store.createUser({ username, password: hashedPassword });
  };

  public findUserByUsernameAndPassword = async (
    username: string,
    password: string
  ): Promise<User | undefined> => {
    const user = await this.store.findUserByUsername(username);
    if (!user) {
      return undefined;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return undefined;
    }
    return user;
  };
}

const createService = (store: StoreInterface) => {
  return new Service(store);
};

export default createService;
