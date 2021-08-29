module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
        'airbnb-typescript-prettier',
    ],
    parserOptions: {
        project: './tsconfig.json',
    },
    env: {
        jest: true,
    },
    rules: {
        'no-underscore-dangle': [2, { allow: ['_id'] }],
        'import/prefer-default-export': 'off',
    },
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['@/daemon', './src/daemon'],
                    ['@/exceptions', './src/exceptions'],
                    ['@/helpers', './src/helpers'],
                    ['@/middlewares', './src/middlewares'],
                    ['@/entities', './src/entities'],
                    ['@/routes', './src/routes'],
                    ['@/loaders', './src/loaders'],
                    ['@/config', './src/config'],
                    ['@/logger', './src/logger'],
                ],
                extensions: ['.ts', '.js', '.jsx', '.json'],
            },
        },
    },
};
