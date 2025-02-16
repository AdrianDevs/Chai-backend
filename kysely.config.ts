import { PostgresDialect } from 'kysely';
import { defineConfig } from 'kysely-ctl';
import { Pool } from 'pg';

export default defineConfig({
  dialect: new PostgresDialect({
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
  }),
  migrations: {
    allowJS: false,
    migrationFolder: './src/database/migrations',
  },
  //   plugins: [],
  // seeds: {
  //   seedFolder: './src/database/seeds',
  // },
});
