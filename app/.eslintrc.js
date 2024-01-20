module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  'extends': [
    'plugin:vue/vue3-strongly-recommended',
    'eslint:recommended'
  ],
  plugins: [
    '@stylistic',
  ],
  parser: 'vue-eslint-parser',
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@stylistic/arrow-parens': [ 'error', 'as-needed' ],
    '@stylistic/brace-style': [ 'error', '1tbs' ],
    '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
    '@stylistic/indent': [ 'error', 2 ],
    '@stylistic/semi': [ 'error', 'never' ],
    'vue/valid-v-slot': [ 'error', { allowModifiers: true, }, ],
    'vue/multi-word-component-names': 'off', // TODO: Change about.vue and user.vue to multi-word
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
