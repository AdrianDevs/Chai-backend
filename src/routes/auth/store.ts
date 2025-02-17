import { db } from '@/database/database';
import { NewUser, User } from '@/database/types/user';
import { StoreInterface } from './service';

class Store implements StoreInterface {
  public createUser = async (user: NewUser): Promise<User> => {
    return await db
      .insertInto('users')
      .values(user)
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  public findUserById = async (id: number): Promise<User | undefined> => {
    return await db
      .selectFrom('users')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  };

  public findUserByUsername = async (
    username: string
  ): Promise<User | undefined> => {
    return await db
      .selectFrom('users')
      .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();
  };

  public findUserByUsernameAndPassword = async (
    username: string,
    password: string
  ): Promise<User | undefined> => {
    return await db
      .selectFrom('users')
      .where('username', '=', username)
      .where('password', '=', password)
      .selectAll()
      .executeTakeFirst();
  };

  public updateUser = async (
    id: number,
    updateWith: Partial<User>
  ): Promise<User> => {
    return await db
      .updateTable('users')
      .set(updateWith)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  public deleteUser = async (id: number): Promise<User | undefined> => {
    return await db
      .deleteFrom('users')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  };
}

export default new Store();
