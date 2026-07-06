// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Ignore build output and dependencies.
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // Base recommended rules for JS and TypeScript.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-specific tweaks.
  {
    languageOptions: {
      globals: {
        // Extension + browser + service worker globals.
        chrome: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Allow intentional "unused" args prefixed with _.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // We use `any` sparingly and deliberately; warn, do not error.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
