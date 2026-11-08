import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const extensions = [
  '.web.tsx',
  '.web.ts',
  '.web.jsx',
  '.web.js',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.json',
];
const workletModule = /(?:@oxy\.so\/bloom|react-native-reanimated)\/lib\/module\/.*\.js$/;
function transformWorklets(code, filename) {
  return transformSync(code, {
    filename,
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      'react-native-reanimated/plugin',
    ],
    parserOpts: { plugins: ['jsx'] },
    configFile: false,
    babelrc: false,
    sourceMaps: true,
  });
}

export default defineConfig(({ command }) => ({
  plugins: [
    {
      name: 'bloom-host-worklets',
      enforce: 'pre',
      transform(code, id) {
        if (workletModule.test(id)) return transformWorklets(code, id);
        // Expo's bridge must survive production tree shaking.
        if (id.endsWith('/ensureNativeModulesAreInstalled.ts'))
          return { code, moduleSideEffects: true };
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-native-web', 'expo', 'expo-modules-core'],
    alias: [
      {
        find: /^expo-modules-core$/,
        replacement: new URL('./node_modules/expo-modules-core/src/index.ts', import.meta.url)
          .pathname,
      },
      { find: /^react-native$/, replacement: 'react-native-web' },
      {
        find: /^buffer$/,
        replacement: new URL('./node_modules/buffer/index.js', import.meta.url).pathname,
      },
    ],
    extensions,
  },
  define: {
    global: 'globalThis',
    __DEV__: command === 'serve',
    'process.env.JEST_WORKER_ID': 'undefined',
    'process.env.EXPO_OS': JSON.stringify('web'),
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'bloom-host-worklets',
          setup(build) {
            build.onLoad({ filter: workletModule }, ({ path }) => ({
              contents: transformWorklets(readFileSync(path, 'utf8'), path).code,
              loader: 'jsx',
            }));
          },
        },
      ],
      loader: { '.js': 'jsx' },
      resolveExtensions: extensions,
    },
  },
  build: {
    assetsInlineLimit: 0,
    commonjsOptions: {
      transformMixedEsModules: true,
      ignoreTryCatch: (id) => !id.startsWith('react-native-web/dist/'),
    },
  },
}));
