const parser = '@typescript-eslint/parser';

const plugins = ['@typescript-eslint', 'promise'];

const extendsAll = ['plugin:@typescript-eslint/recommended', 'plugin:promise/recommended', 'prettier'];

const rules = {
  // Fix `no-shadow` false positives
  'no-shadow': 0,
  '@typescript-eslint/no-shadow': [2],
  // Allow empty functions mainly for default function arguments
  '@typescript-eslint/no-empty-function': 0,
  // Fix `no-use-before-define` false positives
  'no-use-before-define': 0,
  '@typescript-eslint/no-use-before-define': [2, { functions: false }],
  // Enforce type-only imports
  '@typescript-eslint/consistent-type-imports': [
    2,
    {
      prefer: 'type-imports',
      disallowTypeAnnotations: true,
    },
  ],
  // Allow named exports when module exports only a single declaration
  'import/prefer-default-export': 0,
  // No imports with file extensions
  'import/extensions': 0,
  // Force trailing comma only for multiline
  'comma-dangle': [2, 'always-multiline'],
  // Enforce ES2017 async/await syntax
  'promise/prefer-await-to-then': 2,
  'promise/prefer-await-to-callbacks': 2,
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  // No imports with file extensions
  'import/extensions': 0,
  // Allow logging in Node applications
  'no-console': [2, { allow: ['log', 'error', 'warn', 'debug'] }],
  // Allow sequential async iterations
  'no-await-in-loop': 0,
  // We need synchronous async iterations which can be accomplished with `for..of` and `for`
  // To avoid workarounds with excessive `for` construct it makes more sense to remove `ForOfStatement` error
  'no-restricted-syntax': [
    2,
    {
      selector: 'ForInStatement',
      message:
        'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
    },
    {
      selector: 'LabeledStatement',
      message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
    },
    {
      selector: 'WithStatement',
      message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
    },
  ],
  quotes: [2, 'single', { avoidEscape: true, allowTemplateLiterals: false }],
};

const overrides = {
  files: '**/*.ts',
  parser,
  plugins,
  extends: extendsAll,
  rules,
};

const overridesJson = {
  files: '**/package.json',
  plugins: ['json-files'],
  rules: {
    'json-files/no-branch-in-dependencies': 2,
    'json-files/restrict-ranges': [2, { versionRegex: '^[^(~|^)]+$' }],
    'json-files/sort-package-json': 2,
    'json-files/no-branch-in-dependencies': 0,
  },
};

module.exports = {
  env: {
    node: true,
  },
  overrides: [overrides, overridesJson],
};
