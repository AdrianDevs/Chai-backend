import { Kysely, sql } from 'kysely';
import { Database } from '@database/types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('message')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('content', 'varchar', (col) => col.notNull())
    .addColumn('user_id', 'integer', (col) =>
      col.references('user.id').onDelete('set null')
    )
    .addColumn('conversation_id', 'integer', (col) =>
      col.references('conversation.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('message').execute();
}
