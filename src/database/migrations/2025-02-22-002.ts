import { Kysely } from 'kysely';
import { Database } from '../types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('conversation_user')
    .addColumn('conversation_id', 'integer', (col) =>
      col.references('conversation.id').onDelete('cascade').notNull()
    )
    .addColumn('user_id', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull()
    )
    .addColumn('last_read_message_id', 'integer', (col) =>
      col.references('message.id').onDelete('set null')
    )
    .addPrimaryKeyConstraint('primary_key_convo_user', [
      'conversation_id',
      'user_id',
    ])
    // .addForeignKeyConstraint('conversation_id_foreign', ['conversation_id'], 'conversation', ['id'])
    // .addForeignKeyConstraint('user_id_foreign', ['user_id'], 'user', ['id'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('conversation_user').execute();
}
