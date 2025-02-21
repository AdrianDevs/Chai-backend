import { db } from '@/database/database';
import { NewUser, User } from '@/database/types/user';
import { UserStoreInterface } from './service';

class Store implements UserStoreInterface {
  public createUser = async (user: NewUser): Promise<User> => {
    return await db
      .insertInto('user')
      .values(user)
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  public findUserById = async (id: number): Promise<User | undefined> => {
    return await db
      .selectFrom('user')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  };

  public findUserByUsername = async (
    username: string
  ): Promise<User | undefined> => {
    return await db
      .selectFrom('user')
      .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();
  };

  public updateUser = async (
    id: number,
    updateWith: Partial<User>
  ): Promise<User> => {
    return await db
      .updateTable('user')
      .set(updateWith)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  public deleteUser = async (id: number): Promise<User | undefined> => {
    return await db
      .deleteFrom('user')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  };
}

export default new Store();
