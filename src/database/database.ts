import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './types';

dotenv.config();
let dbInstance: Kysely<Database> | null = null;

const getDB = () => {
  if (!dbInstance) {
    const dialect = new PostgresDialect({
      pool: new Pool({
        database: process.env.POSTGRES_DB,
        host: process.env.POSTGRES_HOST,
        password: process.env.POSTGRES_PASSWORD,
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }),
    });

    dbInstance = new Kysely<Database>({
      dialect,
    });
  }

  return dbInstance;
};

export const db = getDB();

export const destroyDB = () => {
  if (dbInstance) {
    db.destroy();
  }
};
