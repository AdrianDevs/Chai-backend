import { UserServiceInterface } from './controllers';
import { NewUser, User } from '@/database/types/user';
import {
  generatePassword,
  issueJWT,
  JwtToken,
  validatePassword,
} from '@/utils';

export interface StoreInterface {
  createUser: (user: NewUser) => Promise<User>;
  findUserById: (id: number) => Promise<User | undefined>;
  findUserByUsername: (username: string) => Promise<User | undefined>;
  updateUser: (id: number, updateWith: Partial<User>) => Promise<User>;
  deleteUser: (id: number) => Promise<User | undefined>;
}

class Service implements UserServiceInterface {
  private store: StoreInterface;

  constructor(store: StoreInterface) {
    this.store = store;
  }

  public signup = async (
    username: string,
    password: string
  ): Promise<User & JwtToken> => {
    const saltHash = generatePassword(password);
    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const user = await this.store.createUser({
      username,
      password: hash,
      salt,
    });

    const tokenObject = issueJWT(user);
    return { ...user, ...tokenObject };
  };

  public login = async (
    username: string,
    password: string
  ): Promise<(User & JwtToken) | undefined> => {
    const user = await this.store.findUserByUsername(username);

    if (!user) {
      return undefined;
    }

    const isValid = validatePassword(password, user.password, user.salt);

    if (!isValid) {
      return undefined;
    }

    const tokenObject = issueJWT(user);
    return { ...user, ...tokenObject };
  };

  public findUserById = async (id: number): Promise<User | undefined> => {
    return await this.store.findUserById(id);
  };
}

const createService = (store: StoreInterface) => {
  return new Service(store);
};

export default createService;
