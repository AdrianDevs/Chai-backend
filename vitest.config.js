import { resolve } from 'path';

export default {
  test: {
    environment: 'node',
    setupFiles: 'src/tests/load-env.ts',
    globalSetup: 'src/tests/global-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '/src'),
      '@auth': resolve(__dirname, './src/routes/auth'),
      '@users': resolve(__dirname, './src/routes/users'),
      '@conversations': resolve(__dirname, './src/routes/conversations'),
      '@messages': resolve(__dirname, './src/routes/messages'),
      '@database': resolve(__dirname, './src/database'),
    },
  },
};
