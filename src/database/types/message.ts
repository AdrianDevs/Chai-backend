import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface MessageTable {
  id: Generated<number>;
  content: string;
  user_id: number;
  conversation_id: number;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Message = Selectable<MessageTable>;
export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>;
