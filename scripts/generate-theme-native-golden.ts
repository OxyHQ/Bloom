/**
 * Deliberately rebase the native theme goldens — the cases the Swift and Kotlin ports of Bloom's
 * theme must reproduce byte for byte (src/theme/__tests__/fixtures/native-*-golden.jsonl) — after
 * an approved colour-policy, preset or engine change. Like `generate-theme-golden.ts`, this is
 * NOT in prebuild: an accidental drift must fail the native tests, not regenerate their answers.
 *
 * The cases (scripts/swift-theme/native-golden-cases.ts) are bundled here and run under NODE, so
 * every double is V8's (fdlibm maths), which is what the ports match; `react-native` is replaced
 * by the two names the pure colour pipeline reaches for (scripts/swift-theme/react-native-stub.ts).
 *
 *   bun run generate:theme-native-golden            # rewrite the goldens
 *   bun scripts/generate-theme-native-golden.ts --check   # exit 1 when they no longer match
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = join(repoRoot, 'node_modules/.cache/bloom-theme-native-golden');
mkdirSync(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(repoRoot, 'scripts/swift-theme/native-golden-main.ts')],
  outdir,
  target: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'react-native-stub',
      setup(build) {
        build.onResolve({ filter: /^react-native$/ }, () => ({
          path: 'react-native',
          namespace: 'rn-stub',
        }));
        build.onLoad({ filter: /.*/, namespace: 'rn-stub' }, () => ({
          loader: 'js',
          contents: `
            export const Platform = { OS: 'ios', select: (o) => o.ios ?? o.native ?? o.default };
            export const Appearance = { getColorScheme: () => 'light' };
            export const AccessibilityInfo = {};
            export const StyleSheet = { create: (s) => s, hairlineWidth: 1 };
            export const processColor = (c) => (typeof c === 'string' ? 1 : null);
          `,
        }));
      },
    },
  ],
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
const bundle = result.outputs[0]?.path;
if (bundle === undefined) throw new Error('no bundle');
const run = spawnSync('node', [bundle, repoRoot, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(run.status ?? 1);
