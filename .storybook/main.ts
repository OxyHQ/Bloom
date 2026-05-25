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
   *   - Stub `react-native-reanimated`, `react-native-gesture-handler`, and
   *     `react-native-safe-area-context` because their worklet/native code
   *     can't run in a browser. The stubs preserve component identity so
   *     trees render statically with no animation.
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
          {
            find: /^react-native-reanimated$/,
            replacement: path.resolve(__dirname, 'mocks/reanimated.ts'),
          },
          {
            find: /^react-native-gesture-handler$/,
            replacement: path.resolve(__dirname, 'mocks/gesture-handler.tsx'),
          },
          {
            find: /^react-native-safe-area-context$/,
            replacement: path.resolve(__dirname, 'mocks/safe-area-context.tsx'),
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
      define: {
        __DEV__: 'true',
        global: 'globalThis',
      },
      optimizeDeps: {
        include: ['react-native-web'],
        exclude: [
          'react-native',
          'react-native-reanimated',
          'react-native-gesture-handler',
          'react-native-safe-area-context',
        ],
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
