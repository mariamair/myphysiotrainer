import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { 
    files: ['**/*.{js,mjs,cjs}'], 
    plugins: { js },
    extends: ['js/recommended'],
    rules: {
      'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
      camelcase: ['error', { properties: 'always' }],
      'eol-last': ['error', 'always'],
      indent: ['error', 2],
      'key-spacing': ['error', { 'mode': 'strict' }],
      'max-depth': ['warn', { 'max': 3 }],
      'max-len': ['warn', 
        { 
          'code': 120,
          'ignoreComments': true,
          'ignoreUrls': true 
        }],
      'max-params': ['warn', { 'max': 3 }],
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single']
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node
      }
    }
  }
])
