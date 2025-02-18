import dotenv from 'dotenv';

export function setup() {
  // eslint-disable-next-line no-console
  console.log('global-setup');
  dotenv.config({ path: process.env.ENV_FILE || '.env' });
  process.env.NODE_ENV = 'TEST';
  // eslint-disable-next-line no-console
  console.log('- Environment: ', process.env.NODE_ENV);
}

export function teardown() {
  // eslint-disable-next-line no-console
  console.log('global-teardown');
}
