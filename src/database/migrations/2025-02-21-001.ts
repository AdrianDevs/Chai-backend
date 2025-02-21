import { Kysely, sql } from 'kysely';
import { Database } from '@database/types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('conversation')
    .addColumn('id', 'integer', (col) =>
      col.generatedAlwaysAsIdentity().primaryKey()
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('conversation').execute();
}
