import { MessageTable } from './message';
import { UserTable } from './user';

export interface Database {
  users: UserTable;
  messages: MessageTable;
}
