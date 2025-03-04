import { db } from '@/database/database';
import { NewUser, User } from '@/database/types/user';
import { UserStoreInterface } from './service';

class Store implements UserStoreInterface {
  public numberOfUsers = async (): Promise<number> => {
    const result = await db
      .selectFrom('user')
      .select((eb) => [eb.fn.count<number>('user.id').as('count')])
      .executeTakeFirstOrThrow();

    return result.count;
  };

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

  public findUsersByUsernames = async (
    usernames: string[]
  ): Promise<User[]> => {
    return await db
      .selectFrom('user')
      .selectAll()
      .where('username', 'in', usernames)
      .execute();
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
    return await db.transaction().execute(async (trx) => {
      let user = await trx
        .selectFrom('user')
        .where('id', '=', id)
        .selectAll()
        .executeTakeFirst();

      if (!user) {
        return undefined;
      }

      // Get all conversations the user is in
      const conversations = await trx
        .selectFrom('conversation_user')
        .where('user_id', '=', id)
        .selectAll()
        .execute();

      if (conversations.length > 0) {
        // If there are any conversations that only have the user, delete the conversation
        for (const conversation of conversations) {
          const conversationUsers = await trx
            .selectFrom('conversation_user')
            .where('conversation_id', '=', conversation.conversation_id)
            .selectAll()
            .execute();

          if (
            conversationUsers.length === 1 &&
            conversationUsers[0].user_id === id
          ) {
            await trx
              .deleteFrom('conversation')
              .where('id', '=', conversation.conversation_id)
              .execute();
          }
        }

        // Delete conversation users for the user
        await trx
          .deleteFrom('conversation_user')
          .where('user_id', '=', id)
          .execute();
      }

      // Delete the user
      user = await trx
        .deleteFrom('user')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    });
  };
}

export default new Store();
