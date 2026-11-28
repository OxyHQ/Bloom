/**
 * The node entry of `scripts/generate-theme-native-golden.ts` (bundled by bun, run by node so the
 * goldens carry V8's doubles): `node <bundle> <repoRoot> [--check]`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { nativeGoldenFiles } from './native-golden-cases';

const repoRoot = process.argv[2];
if (repoRoot === undefined) throw new Error('usage: node <bundle> <repoRoot> [--check]');
const check = process.argv.includes('--check');
const dir = join(repoRoot, 'src/theme/__tests__/fixtures');

let stale = 0;
for (const [file, text] of Object.entries(nativeGoldenFiles(repoRoot))) {
  const path = join(dir, file);
  if (check) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {}
    if (current !== text) {
      console.error(`[generate-theme-native-golden] differs: ${relative(repoRoot, path)}`);
      stale += 1;
    }
  } else {
    writeFileSync(path, text);
    console.log(
      `[generate-theme-native-golden] wrote ${relative(repoRoot, path)} (${text.split('\n').length - 1} cases, ${text.length} bytes)`,
    );
  }
}
if (stale > 0) process.exit(1);
if (check)
  console.log(`[generate-theme-native-golden] goldens are current (node ${process.version})`);
