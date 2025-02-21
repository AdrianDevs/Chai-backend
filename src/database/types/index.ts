import { UserTable } from './user';
import { MessageTable } from './message';
import { ConversationTable, ConversationUserTable } from './conversation';

export interface Database {
  user: UserTable;
  message: MessageTable;
  conversation: ConversationTable;
  conversation_user: ConversationUserTable;
}
