React + TypeScript + Vite
Este template fornece uma configuração mínima para fazer o React funcionar no Vite com HMR e algumas regras do ESLint.

Atualmente, dois plugins oficiais estão disponíveis:

@vitejs/plugin-react usa Babel (ou oxc quando usado no rolldown-vite) para Fast Refresh

@vitejs/plugin-react-swc usa SWC para Fast Refresh

React Compiler
O React Compiler não está habilitado neste template devido ao seu impacto na performance de desenvolvimento e build. Para adicioná-lo, veja esta documentação.

Expandindo a configuração do ESLint
Se você está desenvolvendo uma aplicação de produção, recomendamos atualizar a configuração para habilitar regras de lint baseadas em tipos (type-aware):
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

Você também pode instalar eslint-plugin-react-x e eslint-plugin-react-dom para regras de lint específicas do React:

// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

