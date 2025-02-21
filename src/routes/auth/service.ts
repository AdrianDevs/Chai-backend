import { AuthServiceInterface } from './controllers';
import { UserStoreInterface } from '@users/service';
import { User } from '@/database/types/user';
import {
  generatePassword,
  issueJWT,
  JwtToken,
  validatePassword,
} from '@/utils';
import { CustomError } from '@/errors';

class Service implements AuthServiceInterface {
  private store: UserStoreInterface;

  constructor(store: UserStoreInterface) {
    this.store = store;
  }

  public signup = async (
    username: string,
    password: string
  ): Promise<User & JwtToken> => {
    const saltHash = generatePassword(password);

    const userExists = await this.store.findUserByUsername(username);
    if (userExists) {
      throw new CustomError(409, 'User already exists');
    }

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

  public findUserByUsername = async (
    username: string
  ): Promise<User | undefined> => {
    return await this.store.findUserByUsername(username);
  };
}

const createService = (store: UserStoreInterface) => {
  return new Service(store);
};

export default createService;
