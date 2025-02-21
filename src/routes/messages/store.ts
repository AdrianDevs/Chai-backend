import { db } from '@/database/database';
import { Message, MessageUpdate, NewMessage } from '@/database/types/message';
import { StoreInterface } from './services';

class Store implements StoreInterface {
  public getMessages = async (): Promise<Message[]> => {
    return await db.selectFrom('message').selectAll().execute();
  };

  public findMessageById = async (id: number): Promise<Message | undefined> => {
    return await db
      .selectFrom('message')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  };

  public findMessages = async (
    criteria: Partial<Message>
  ): Promise<Message[]> => {
    let query = db.selectFrom('message');

    if (criteria.id) {
      query = query.where('id', '=', criteria.id);
    }

    if (criteria.message) {
      query = query.where('message', '=', criteria.message);
    }

    if (criteria.user_name) {
      query = query.where('user_name', '=', criteria.user_name);
    }

    if (criteria.created_at) {
      query = query.where('created_at', '=', criteria.created_at);
    }

    return await query.selectAll().execute();
  };

  public createMessage = async (message: NewMessage): Promise<Message> => {
    return await db
      .insertInto('message')
      .values(message)
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  public updateMessage = async (
    id: number,
    updateWith: MessageUpdate
  ): Promise<Message> => {
    return await db
      .updateTable('message')
      .set(updateWith)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  public deleteMessage = async (id: number): Promise<Message | undefined> => {
    return await db
      .deleteFrom('message')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  };
}

export default new Store();
