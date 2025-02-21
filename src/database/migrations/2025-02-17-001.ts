import { Kysely } from 'kysely';
import { Database } from '@database/types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('salt', 'varchar', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('user').dropColumn('salt').execute();
}
