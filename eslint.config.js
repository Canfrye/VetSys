import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // backend/, kendi package.json + Node.js (CommonJS) ortamına sahip ayrı
  // bir proje olduğu için bu (React/Vite odaklı) frontend lint yapılandırması
  // kapsamı dışındadır (bkz. backend/README.md).
  // electron/ main process de ayrı Node ortamıdır.
  globalIgnores(['dist', 'backend', 'electron', 'release']),
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        __VETSYS_VERSION__: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
