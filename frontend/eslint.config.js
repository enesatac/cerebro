import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict, prettier],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services/mock/*', '**/services/mock/*'],
              message:
                'Import data through the repository registry (@/services/repositories) — never mock data directly.',
            },
          ],
        },
      ],
    },
  },
  {
    // Route tables and context modules legitimately mix components with non-component exports.
    files: ['src/app/router/routes.tsx', 'src/services/RepositoryContext.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // The repository registry and tests are the only places allowed to touch mock implementations.
    files: [
      'src/services/repositories.ts',
      'src/services/mock/**',
      '**/*.test.{ts,tsx}',
      'src/test/**',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
);
