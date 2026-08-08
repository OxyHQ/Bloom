/**
 * Generate the static `src/design-tokens/tokens.json` artifact from the SAME
 * source as `getPresetVars()` / `theme.css` — Bloom's colour engine — so the
 * machine-readable token export and the runtime palette can never drift.
 *
 * Consumers that are not browsers read this instead of the CSS:
 *
 *   import tokens from '@oxyhq/bloom/design-tokens/tokens.json';
 *
 * The checked-in output is verified in `src/__tests__/design-tokens-json.test.ts`,
 * which asserts the file is byte-identical to `renderBloomTokensJson()`.
 *
 * Run with bun (imports the TS source directly):
 *   bun run generate:tokens-json
 *
 * Wired as a `prebuild` step so `bun run build` always regenerates it.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderBloomTokensJson } from '../src/design-tokens/tokens-json';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const OUT_PATH = join(REPO_ROOT, 'src', 'design-tokens', 'tokens.json');

const json = renderBloomTokensJson();

writeFileSync(OUT_PATH, json);
console.log(
  `[generate-design-tokens-json] wrote ${relative(REPO_ROOT, OUT_PATH)} (${json.length} bytes)`,
);
