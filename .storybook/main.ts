import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { mergeConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  // `templates/` holds full-screen templates as stories only: composed
  // from Bloom's components, never published (outside `src`, not in `files`).
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)', '../templates/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
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
   *
   * `@tailwindcss/vite` compiles `.storybook/tailwind.css` (imported by
   * `preview.tsx`). Without it every Bloom `className` still reaches the DOM —
   * react-native-css stamps the literal tokens onto the `class` attribute via
   * react-native-web's `$$css` escape hatch — but no rule backs any of them, so
   * layout utilities are inert and the harness reports success on components
   * whose layout never applied. That is the exact shape of the `fonts={false}`
   * gap above: nothing errors, and the story still looks plausible.
   */
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      plugins: [
        tailwindcss(),
        {
          name: 'bloom-expo-web-bootstrap',
          // Expo's web bridge is an empty exported function plus a side-effect
          // polyfill import. Its package marks only the latter as side-effectful,
          // allowing production tree shaking to drop the bridge and installer.
          transform(code: string, id: string) {
            if (/\/expo-modules-core\/src\/ensureNativeModulesAreInstalled\.ts$/.test(id.split('?')[0]!)) {
              return { code, map: null, moduleSideEffects: true };
            }
            return null;
          },
        },
      ],
      build: {
        commonjsOptions: {
          // Reanimated's webUtils is ESM with optional RNW compiler requires.
          // Dev optimizeDeps transforms them, but a static build otherwise
          // leaves browser `require` calls inside swallowed try/catch blocks.
          // Its DOM updater then falls through to Object.keys(node.props).
          transformMixedEsModules: true,
          // Resolve only the installed RNW internals; preserve optional-peer
          // try/catch boundaries elsewhere in the graph.
          ignoreTryCatch: (id: string) => !id.startsWith('react-native-web/dist/'),
        },
      },
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
        'process.env': '{}',
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
