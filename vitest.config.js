import { resolve } from 'path';

export default {
  test: {
    environment: 'node',
    setupFiles: 'src/test/load-env.ts',
    globalSetup: 'src/test/global-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@users': resolve(__dirname, './src/users'),
      '@messages': resolve(__dirname, './src/messages'),
      '@database': resolve(__dirname, './src/database'),
    },
  },
};
