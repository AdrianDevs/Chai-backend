import {
  Conversation,
  ConversationUpdate,
  NewConversation,
} from '@/database/types/conversation';
import { ConversationStoreInterface } from './service';
import { db } from '@/database/database';

class Store implements ConversationStoreInterface {
  public createConversation = async (
    conversation: NewConversation,
    userIds: number[]
  ): Promise<Conversation> => {
    return await db.transaction().execute(async (trx) => {
      const convo = await trx
        .insertInto('conversation')
        .values(conversation)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('conversation_user')
        .values(
          userIds.map((userId) => ({
            conversation_id: convo.id,
            user_id: userId,
          }))
        )
        .execute();

      return convo;
    });
  };

  public getConversations = async (userId: number): Promise<Conversation[]> => {
    return await db
      .selectFrom('conversation')
      .innerJoin(
        'conversation_user',
        'conversation.id',
        'conversation_user.conversation_id'
      )
      .where('conversation_user.user_id', '=', userId)
      .selectAll()
      .execute();
  };

  public findConversationById = async (
    convoID: number
  ): Promise<Conversation | undefined> => {
    return await db
      .selectFrom('conversation')
      .where('id', '=', convoID)
      .selectAll()
      .executeTakeFirst();

    // if (!convo) {
    //   return undefined;
    // }

    // const convoUser = await db
    //   .selectFrom('conversation_user')
    //   .where('conversation_id', '=', convo.id)
    //   .where('user_id', '=', userID)
    //   .selectAll()
    //   .executeTakeFirst();

    // if (!convoUser) {
    //   throw new CustomError(403, 'Forbidden');
    // }

    // return convo;

    // return await db
    //   .selectFrom('conversation')
    //   .innerJoin(
    //     'conversation_user',
    //     'conversation.id',
    //     'conversation_user.conversation_id'
    //   )
    //   .where('conversation_user.user_id', '=', userID)
    //   .where('conversation.id', '=', convoID)
    //   .selectAll()
    //   .executeTakeFirst();
  };

  public updateConversation = async (
    convoID: number,
    updateWith: ConversationUpdate
  ): Promise<Conversation | undefined> => {
    return await db
      .updateTable('conversation')
      .set({ name: updateWith.name })
      .where('id', '=', convoID)
      .returningAll()
      .executeTakeFirst();
  };

  public delteConversation = async (
    id: number
  ): Promise<Conversation | undefined> => {
    return await db
      .deleteFrom('conversation')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  };
}

export default new Store();
