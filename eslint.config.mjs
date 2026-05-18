import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  unicorn.configs['recommended'],
  prettierConfig,
  {
    files: ['lib/utils.ts'],
    rules: {
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    linterOptions: {
      noInlineConfig: true,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      prettier,
      'better-tailwindcss': betterTailwindcss,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression',
          message: 'Type assertions are not allowed.',
        },
        {
          selector: 'TSTypeAssertion',
          message: 'Type assertions are not allowed.',
        },
      ],

      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
        },
      ],

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      'prettier/prettier': 'error',

      'better-tailwindcss/enforce-consistent-class-order': 'error',
      'better-tailwindcss/no-deprecated-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
    },
  },
  {
    files: ['components/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    'node_modules/**',
  ]),
]);

export default eslintConfig;
