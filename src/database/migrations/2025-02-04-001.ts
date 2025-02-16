import { Kysely, sql } from 'kysely';
import { Database } from '@database/types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('messages')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_name', 'varchar', (col) => col.notNull())
    .addColumn('message', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('message').execute();
}
