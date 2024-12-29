import stylistic from '@stylistic/eslint-plugin'
import vueEslintParser from 'vue-eslint-parser'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/strongly-recommended'],
  {
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      parser: vueEslintParser,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': 'off',
      '@stylistic/arrow-parens': [ 'error', 'as-needed' ],
      '@stylistic/brace-style': [ 'error', '1tbs' ],
      '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/semi': [ 'error', 'never' ],
      'vue/valid-v-slot': [ 'error', { allowModifiers: true } ],
      'vue/multi-word-component-names': 'off', // TODO: Change about.vue and chart.vue to multi-word
    },
    files: [ '**/*.js', '**/*.vue' ],
  },
]
