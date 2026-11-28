/**
 * The native theme ports (Swift `BloomTheme`, Kotlin `bloom-ui`) are proven against goldens this
 * theme writes (`fixtures/native-*-golden.jsonl`, `bun run generate:theme-native-golden`). Like
 * the frozen oracle they are rebased on purpose, never in prebuild — so a policy, preset or engine
 * change that moves them fails here, under node's V8 maths, until they are deliberately rebased
 * and the native tests follow.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { nativeGoldenFiles } from '../../../scripts/swift-theme/native-golden-cases';

const repoRoot = join(__dirname, '..', '..', '..');

describe('native theme goldens', () => {
  const files = nativeGoldenFiles(repoRoot);
  for (const [file, text] of Object.entries(files)) {
    it(`${file} is what the theme computes`, () => {
      const current = readFileSync(join(__dirname, 'fixtures', file), 'utf8');
      // Compared line by line so a failure names the case instead of printing megabytes.
      const expected = text.split('\n');
      const actual = current.split('\n');
      const differing = expected
        .filter((line, i) => line !== actual[i])
        .map((line) => line.slice(0, 80));
      expect(differing).toEqual([]);
      expect(actual.length).toBe(expected.length);
    });
  }
});
