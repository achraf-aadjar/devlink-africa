import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'
// Règles d'accessibilité maison : eslint-plugin-jsx-a11y tire axe-core (MPL-2.0),
// interdite par le règlement du concours. Voir docs/DECISIONS.md.
import a11y from './eslint-rules/a11y.js'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      a11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'a11y/img-requires-alt': 'error',
      'a11y/anchor-requires-href': 'error',
      'a11y/target-blank-requires-noopener': 'error',
      'a11y/button-requires-type': 'error',
      'a11y/control-requires-label': 'error',
      'a11y/clickable-needs-keyboard': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Le jeton d'authentification ne doit jamais finir dans la console.
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
)
