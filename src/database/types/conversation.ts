import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface ConversationTable {
  id: Generated<number>;
  name: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Conversation = Selectable<ConversationTable>;
export type NewConversation = Insertable<ConversationTable>;
export type ConversationUpdate = Updateable<ConversationTable>;

export interface ConversationUserTable {
  conversation_id: number;
  user_id: number;
  last_read_message_id: number | null;
}

export type ConversationUser = Selectable<ConversationUserTable>;
export type NewConversationUser = Insertable<ConversationUserTable>;
export type ConversationUserUpdate = Updateable<ConversationUserTable>;
