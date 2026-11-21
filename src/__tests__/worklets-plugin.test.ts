/**
 * @jest-environment node
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { transformSync } from '@babel/core';

/**
 * Every source file that hands work to Reanimated or Gesture Handler compiles
 * under the worklets Babel plugin, as an app's Metro compiles it.
 *
 * The plugin workletizes a Gesture Handler 3 hook's config object and refuses
 * some shapes inside it: a spread in `usePanGesture({ ...offsets })` throws
 * "'SpreadElement' as to-be workletized argument is not supported for object
 * hooks" and fails the app's release bundle. Nothing in Bloom runs that plugin
 * over its own source otherwise — not the build, not tsc, not jest's mocks — so
 * the motion gesture layer's first device build was the first to see it. The
 * layer now builds builder gestures (`Gesture.Pan()…`), whose callback chains
 * the plugin compiles too.
 */
const SRC = join(__dirname, '..');
const ENGINES = /from 'react-native-(reanimated|gesture-handler|worklets)'/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry) && !entry.endsWith('.d.ts') && !entry.includes('.stories.')
      ? [full]
      : [];
  });
}

describe('the worklets Babel plugin', () => {
  it('compiles every file that uses Reanimated or Gesture Handler', () => {
    const files = sourceFiles(SRC).filter((file) => ENGINES.test(readFileSync(file, 'utf8')));
    const failures: string[] = [];
    for (const file of files) {
      try {
        transformSync(readFileSync(file, 'utf8'), {
          filename: file,
          babelrc: false,
          configFile: false,
          presets: [
            ['@babel/preset-typescript', { isTSX: file.endsWith('.tsx'), allExtensions: true }],
          ],
          plugins: ['react-native-worklets/plugin'],
        });
      } catch (error) {
        failures.push(`${relative(SRC, file)}: ${String((error as Error).message).split('\n')[0]}`);
      }
    }
    // Vacuity floor: the gesture layer and the toast's swipe are among them.
    expect(files.length).toBeGreaterThan(50);
    expect(failures).toEqual([]);
  }, 120_000);
});
