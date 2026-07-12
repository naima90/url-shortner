// Root ESLint config. Each workspace extends this so lint rules stay consistent
// across the whole monorepo. The web app adds Next.js-specific rules on top.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // keep ESLint out of Prettier's way (formatting is Prettier's job)
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist', '.next', 'node_modules', 'coverage'],
  rules: {
    // Allow unused args that start with _ (common for Express middleware signatures).
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
