import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import topLevelAwait from 'vite-plugin-top-level-await';
import federation from '@originjs/vite-plugin-federation';
import tsconfigPath from 'vite-tsconfig-paths';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const deps = require('./package.json').dependencies;

/* TODO: Fix for real */
/* Probably bad way of fixing this */
delete deps['@emotion/react'];
delete deps['@emotion/styled'];
delete deps['@mui/material'];
delete deps['@mui/styles'];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'pefcl',
      filename: 'remoteEntry.js',
      exposes: {
        './config': './npwd.config.ts',
      },
      shared: ['react', 'react-dom', '@emotion/react', 'react-router-dom', 'fivem-nui-react-lib'],
    }),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
    tsconfigPath(),
  ],
  server: {
    port: 3004,
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,
    assetsDir: '',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@components/*': 'src/components/*',
      '@ui/*': 'src/components/ui/*',
      '@hooks/*': 'src/hooks/*',
      '@data/*': 'src/data/*',
      '@utils/*': 'src/utils/*',
      '@locales/*': '../locales/*',
      '@typings/*': '../typings/*',
      '@shared/*': '../shared/*',
    },
  },
});
