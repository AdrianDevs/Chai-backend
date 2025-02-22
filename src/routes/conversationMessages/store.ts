import { db } from '@/database/database';
import { Message, NewMessage } from '@/database/types/message';
import { ConversationMessageStoreInterface } from './service';

class Store implements ConversationMessageStoreInterface {
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
    return await db
      .insertInto('message')
      .values(message)
      .returningAll()
      .executeTakeFirst();
  };
}

export default new Store();
