import dotenv from 'dotenv';
import * as path from 'path';
import { promises as fs } from 'fs';
import { Pool } from 'pg';
import { Database } from './types';
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from 'kysely';

dotenv.config();

export async function migrateToLatest(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Migrating to latest version...');

  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        database: process.env.POSTGRES_DB,
        host: process.env.POSTGRES_HOST,
        password: process.env.POSTGRES_PASSWORD,
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      // eslint-disable-next-line no-console
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      // eslint-disable-next-line no-console
      console.error(`failed to execute migration "${it.migrationName}"`);
    } else {
      // eslint-disable-next-line no-console
      console.error(`unknown migration status: ${it.status}`);
    }
  });

  if (results?.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No migrations were executed.');
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error('failed to migrate');
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }

  await db.destroy();

  // eslint-disable-next-line no-console
  console.log('Migration completed successfully.');
}
