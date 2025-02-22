import { db } from '@/database/database';
import { ConversationUserStoreInterface } from './service';
import { User } from '@/database/types/user';
import { ConversationUser } from '@/database/types/conversation';

class Store implements ConversationUserStoreInterface {
  public findUserInConversation = async (
    userID: number,
    convoID: number
  ): Promise<(User & ConversationUser) | undefined> => {
    return await db
      .selectFrom('user')
      .innerJoin('conversation_user', 'user.id', 'conversation_user.user_id')
      .where('conversation_user.conversation_id', '=', convoID)
      .where('conversation_user.user_id', '=', userID)
      .selectAll()
      .executeTakeFirst();
  };

  public findUsersInConversation = async (
    convoID: number
  ): Promise<(User & ConversationUser)[] | undefined> => {
    return await db
      .selectFrom('user')
      .innerJoin('conversation_user', 'user.id', 'conversation_user.user_id')
      .where('conversation_user.conversation_id', '=', convoID)
      .selectAll()
      .execute();
  };

  public addUserToConversation = async (
    userID: number,
    convoID: number
  ): Promise<ConversationUser | undefined> => {
    const result = await db
      .insertInto('conversation_user')
      .values({
        user_id: userID,
        conversation_id: convoID,
      })
      .returningAll()
      .executeTakeFirst();
    return result;
  };

  public removeUserFromConversation = async (
    userID: number,
    convoID: number
  ): Promise<ConversationUser | undefined> => {
    return await db
      .deleteFrom('conversation_user')
      .where('user_id', '=', userID)
      .where('conversation_id', '=', convoID)
      .returningAll()
      .executeTakeFirst();
  };
}

export default new Store();
