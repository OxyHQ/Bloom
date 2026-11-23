#!/usr/bin/env node
/**
 * Puts one CI build's addon where the release packs it: inside its committed
 * platform package, at the repository path, under `<out-dir>`.
 *
 *   node scripts/stage-prebuilt.mjs <artifacts-dir> <out-dir>
 *
 * The release workflow downloads every staged build into its checkout before
 * it builds and packs (`prebuilt_artifacts` of Oxy's shared npm release), so
 * `npm/<platform>/` holds its addon there and nowhere else. Exactly one
 * platform's files must be in `<artifacts-dir>`.
 */
import { join, relative, resolve } from 'node:path';

import { copyBuilt, NPM_DIR, ROOT } from './platform-packages.mjs';

const [artifacts, out] = process.argv.slice(2).map((dir) => resolve(dir));
if (!artifacts || !out) throw new Error('usage: stage-prebuilt.mjs <artifacts-dir> <out-dir>');

// The repository root is two levels above the package (packages/<name>).
const fromRepository = relative(resolve(ROOT, '..', '..'), NPM_DIR);
const copied = copyBuilt(artifacts, (platform) => join(out, fromRepository, platform));
if (copied.length !== 1)
  throw new Error(`expected one platform's build in ${artifacts}, found ${copied.length}`);
console.log(`staged ${join(fromRepository, copied[0])}`);
