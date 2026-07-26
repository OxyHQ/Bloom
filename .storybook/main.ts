import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  core: {
    disableTelemetry: true,
  },
  /**
   * Bloom is a React Native component library. To render its components in
   * a web Storybook we:
   *
   *   - Alias `react-native` to `react-native-web` so RN primitives render
   *     in the browser.
   *   - Add `.web.tsx` to the resolved extensions so Bloom's platform-
   *     specific files (e.g. `Dialog.web.tsx`) are picked up.
   *
   * `react-native-reanimated`, `react-native-gesture-handler` and
   * `react-native-safe-area-context` are deliberately NOT stubbed. Storybook now
   * bundles the REAL packages against react-native-web with no worklets babel
   * plugin — precisely the configuration every Oxy consumer ships — so this is a
   * genuine web gate. Stubbing them hid two whole classes of bug: an animation
   * started from a Reanimated mapper never ticks on web, and a stubbed animation
   * builder does nothing whether or not the real one works, so the stub reported
   * success either way.
   *
   * `.storybook/mocks/*` is intentionally left in the tree, unreferenced, as the
   * rollback. Do NOT re-point these aliases at it to make a story pass; fix the
   * component or file the finding.
   */
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      resolve: {
        alias: [
          {
            find: /^react-native$/,
            replacement: 'react-native-web',
          },
          {
            find: 'react-native/Libraries/Image/AssetRegistry',
            replacement: 'react-native-web/dist/modules/AssetRegistry',
          },
        ],
        extensions: [
          '.web.tsx',
          '.web.ts',
          '.web.jsx',
          '.web.js',
          '.tsx',
          '.ts',
          '.jsx',
          '.js',
          '.json',
        ],
      },
      /**
       * `react-native-worklets`'s `platformChecker.js` reads
       * `process.env.JEST_WORKER_ID` at MODULE SCOPE, and reanimated reads
       * `process.env.NODE_ENV` / `process.env.EXPO_OS` the same way. Without a
       * `process.env` define the preview throws `ReferenceError: process is not
       * defined` before any story renders — `#storybook-root` stays empty and
       * Storybook only shows its generic "component failed to render" panel.
       * The specific keys must be listed alongside the bare `process.env`
       * object: Vite replaces the longest matching key first, so the specific
       * entries win where they apply and the bare object catches the rest.
       */
      define: {
        __DEV__: 'true',
        global: 'globalThis',
        'process.env.NODE_ENV': '"development"',
        'process.env.JEST_WORKER_ID': 'undefined',
        'process.env.EXPO_OS': '"web"',
        'process.env': '({})',
      },
      optimizeDeps: {
        include: ['react-native-web'],
        exclude: ['react-native'],
        esbuildOptions: {
          loader: { '.js': 'jsx' },
          resolveExtensions: [
            '.web.tsx',
            '.web.ts',
            '.web.jsx',
            '.web.js',
            '.tsx',
            '.ts',
            '.jsx',
            '.js',
            '.json',
          ],
        },
      },
      root: path.resolve(__dirname, '..'),
    });
  },
};

export default config;
