import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

// Feature modules (src/modules/<name>) must not import each other. Shared code goes in
// components/common, composables, utils, constants or services/api. App-level wiring
// (router, config, stores, layout) may import any module.
const modules = ['asset-inventory', 'auth', 'company', 'dashboard', 'domain-inspection', 'network', 'scans', 'settings', 'source-code', 'tickets', 'web-application']
const crossModuleRules = modules.map((name) => ({
  files: [`src/modules/${name}/**/*.{js,vue}`],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: modules.filter((m) => m !== name).map((m) => `@/modules/${m}/*`),
        message: 'Modules must not import each other. Move shared code to components/common, composables or utils.',
      }],
    }],
  },
}))

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },
  ...crossModuleRules,
]
