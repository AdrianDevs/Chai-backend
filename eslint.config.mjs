import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'prefer-const': 'error',
      'no-undef': 'error',
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used', // Ignore unused arguments before used arguments
          ignoreRestSiblings: true, // Ignore unused rest siblings of rest parameters
          argsIgnorePattern: '^_', // Ignore unused arguments starting with an underscore
          varsIgnorePattern: '^_', // Ignore unused variables starting with an underscore
          caughtErrorsIgnorePattern: '^_', // Ignore caught errors starting with an underscore
        },
      ],
    },
  },
  {
    ignores: ['node_modules', 'dist', 'coverage'],
  },
];
