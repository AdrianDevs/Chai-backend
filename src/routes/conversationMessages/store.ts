import { db } from '@/database/database';
import { Message, NewMessage } from '@/database/types/message';
import { ConversationMessageStoreInterface } from './service';

class Store implements ConversationMessageStoreInterface {
  public numberOfMessages = async (): Promise<number> => {
    const result = await db
      .selectFrom('message')
      .select((eb) => [eb.fn.count<number>('message.id').as('count')])
      .executeTakeFirstOrThrow();

    return result.count;
  };

  public lastMessageAt = async (): Promise<Date | undefined> => {
    const message = await db
      .selectFrom('message')
      .orderBy('created_at', 'desc')
      .limit(1)
      .selectAll()
      .executeTakeFirst();

    return message?.created_at;
  };

  public findMessagesInConversation = async (
    userID: number,
    convoID: number,
    limit: number,
    offset: number
  ): Promise<Message[] | undefined> => {
    return await db.transaction().execute(async (trx) => {
      const messages = await trx
        .selectFrom('message')
        .where('message.conversation_id', '=', convoID)
        .orderBy('message.created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .selectAll()
        .execute();

      if (!messages.length) {
        return messages;
      }

      await trx
        .updateTable('conversation_user')
        .set({ last_read_message_id: messages[0].id })
        .where('user_id', '=', userID)
        .where('conversation_id', '=', convoID)
        .execute();

      return messages;
    });
  };

  public addMessageToConversation = async (
    message: NewMessage
  ): Promise<Message | undefined> => {
    return await db.transaction().execute(async (trx) => {
      const result = await trx
        .insertInto('message')
        .values(message)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('conversation_user')
        .set({ last_read_message_id: result.id })
        .where('conversation_id', '=', message.conversation_id)
        .where('user_id', '=', message.user_id)
        .execute();

      return result;
    });
  };
}

export default new Store();
