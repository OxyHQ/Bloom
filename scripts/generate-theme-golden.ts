/**
 * Deliberately rebase the frozen resolved-token oracle after an approved colour
 * policy or preset-registry change. This is NOT wired into prebuild: an
 * accidental policy drift must fail the oracle instead of regenerating its own
 * expected output.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APP_COLOR_NAMES } from '../src/theme/color-presets';
import { getResolvedTokens } from '../src/theme/token-registry';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const outputPath = join(
  repoRoot,
  'src',
  'theme',
  '__tests__',
  '__fixtures__',
  'golden-resolved-tokens.json',
);

const palettes = Object.fromEntries(
  APP_COLOR_NAMES.flatMap((name) =>
    (['light', 'dark'] as const).map((mode) => [
      `${name}/${mode}`,
      getResolvedTokens(name, mode),
    ]),
  ),
);

const json = `${JSON.stringify(palettes, null, 2)}\n`;
writeFileSync(outputPath, json);
console.log(`[generate-theme-golden] wrote ${relative(repoRoot, outputPath)} (${json.length} bytes)`);
