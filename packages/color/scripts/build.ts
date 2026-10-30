/**
 * Build `lib/` from Bloom's colour engine, `src/theme/color-engine/` at the
 * repository root: its barrel is this package's entry, so `@oxy.so/color` and
 * Bloom's `ColorEngine` namespace publish the same surface from one source.
 *
 * The JavaScript is BUNDLED, one file per format. The engine's relative imports
 * carry no extension (Metro reads Bloom's source as it is), and Node's ESM
 * loader refuses an extensionless relative import; a bundle has none. The
 * declarations are tsc's, one per module, read as CommonJS declarations
 * because the package root has no `"type"` — the shape `@oxy.so/utils` ships,
 * which resolves under `node16` for both CommonJS and ESM consumers.
 */
import { $ } from 'bun';

const ENTRY = new URL('../../../src/theme/color-engine/index.ts', import.meta.url).pathname;
const LIB = new URL('../lib/', import.meta.url);

for (const [format, folder] of [
  ['esm', 'esm'],
  ['cjs', 'cjs'],
] as const) {
  const result = await Bun.build({
    entrypoints: [ENTRY],
    outdir: new URL(folder, LIB).pathname,
    naming: 'index.js',
    format,
    target: 'node',
    // Kept readable: the engine is ~2,700 lines and a consumer debugging a
    // colour reads this file.
    minify: false,
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}

// Node parses every `.js` under a root with no `"type"` as CommonJS; the ESM
// folder says otherwise for itself alone.
await Bun.write(new URL('esm/package.json', LIB), '{"type":"module"}\n');

await $`tsc -p tsconfig.build.json`;
