#!/usr/bin/env node
/**
 * The language's web weight: what an app's bundle carries for the language.
 * Bundles the BUILT packages (`lib/module` of the language and of Bloom) as
 * Metro's web export does with no tree shaking (every module an import
 * reaches is in the bundle whole), minified, every other package external,
 * and fails when:
 *
 * - the root (`@oxy.so/bloom-language`) reaches a family's module beyond the
 *   ones the renderer draws itself (`CORE`): a family is an entry of its own,
 *   so an app pays for it only by importing it (`scripts/generate-entries.mjs`);
 * - the root exceeds its budget (minified bytes and gzip);
 * - a family's entry does not reach its family's module.
 *
 * `--report` also prints what each family's entry adds over the root.
 *
 * Budgets have ~5% headroom over the measurement; raise one only with a reason
 * in the commit.
 *
 *   node scripts/verify-bundle.mjs [--report]   (after `bun run build` at the
 *   repository root and in this package)
 */
import { build } from 'esbuild';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(packageRoot, '../..');
const report = process.argv.includes('--report');
const KiB = 1024;

/** The families the renderer draws itself (a modifier presents them): the root carries these. */
const CORE = new Set(['confirmation-dialog', 'draw', 'overlays', 'product']);
/** The root's budget: minified bytes and gzip of the language and the Bloom it reaches. */
const ROOT_BUDGET = { bytes: 2160 * KiB, gzip: 740 * KiB };

const families = readdirSync(join(packageRoot, 'src/entries'))
  .filter((file) => file.endsWith('.ts'))
  .map((file) => file.slice(0, -'.ts'.length))
  .sort();

/** Bare imports other than Bloom's and the language's are the app's: external. */
const externals = {
  name: 'externals',
  setup(builder) {
    builder.onResolve({ filter: /^[^./]/ }, (args) =>
      /^@oxy\.so\/bloom(-language)?(\/|$)/.test(args.path)
        ? undefined
        : { path: args.path, external: true },
    );
  },
};

/** The first chunk of a bundle of `entries` (each `export *`): what a page loads before it draws. */
async function measure(...entries) {
  const dir = mkdtempSync(join(tmpdir(), 'bloom-language-bundle-'));
  try {
    const entryFile = join(dir, 'entry.js');
    writeFileSync(
      entryFile,
      entries.map((entry) => `export * from ${JSON.stringify(entry)};\n`).join(''),
    );
    const result = await build({
      entryPoints: [entryFile],
      absWorkingDir: packageRoot,
      nodePaths: [join(packageRoot, 'node_modules'), join(repoRoot, 'node_modules')],
      outdir: join(dir, 'out'),
      bundle: true,
      // A dynamic `import()` is a chunk of its own, as in an app's web export.
      splitting: true,
      treeShaking: false,
      minify: true,
      format: 'esm',
      platform: 'browser',
      conditions: ['browser', 'import'],
      resolveExtensions: ['.web.js', '.js', '.json'],
      loader: {
        '.js': 'jsx',
        '.woff2': 'empty',
        '.png': 'empty',
        '.svg': 'empty',
        '.ttf': 'empty',
      },
      define: {
        __DEV__: 'false',
        'process.env.NODE_ENV': '"production"',
        'process.env.EXPO_OS': '"web"',
      },
      plugins: [externals],
      metafile: true,
      write: false,
      logLevel: 'error',
    });
    const outputs = result.metafile.outputs;
    const contents = new Map(result.outputFiles.map((file) => [file.path, file.contents]));
    const first = Object.keys(outputs).find((file) =>
      outputs[file].entryPoint?.endsWith('/entry.js'),
    );
    const initial = new Set([first]);
    const queue = [first];
    while (queue.length)
      for (const link of outputs[queue.pop()].imports)
        if (link.kind === 'import-statement' && !link.external && !initial.has(link.path)) {
          initial.add(link.path);
          queue.push(link.path);
        }
    let bytes = 0;
    let gzip = 0;
    const inputs = [];
    for (const file of initial) {
      const code = contents.get(join(packageRoot, file));
      bytes += code.length;
      gzip += gzipSync(code).length;
      for (const input of Object.keys(outputs[file].inputs))
        inputs.push(relative(repoRoot, join(packageRoot, input)));
    }
    return { bytes, gzip, inputs };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const familyOf = (input) =>
  input.match(/packages\/bloom-language\/lib\/module\/controls\/([\w-]+)\.js$/)?.[1];
const bloomOf = (input) =>
  input.startsWith('packages/') ? undefined : input.match(/^lib\/module\/([\w-]+)\//)?.[1];
const kib = (bytes) => `${(bytes / KiB).toFixed(0)} KiB`;

const problems = [];
const root = await measure('@oxy.so/bloom-language');
const rootInputs = new Set(root.inputs);
const rootFamilies = new Set(root.inputs.map(familyOf).filter(Boolean));
console.log(`root: ${kib(root.bytes)} (gzip ${kib(root.gzip)}), ${root.inputs.length} modules`);
for (const family of rootFamilies)
  if (!CORE.has(family))
    problems.push(
      `the root reaches controls/${family}: a family is drawn only once its entry is imported`,
    );
for (const key of ['bytes', 'gzip'])
  if (root[key] > ROOT_BUDGET[key])
    problems.push(`the root's ${key} ${kib(root[key])} exceed the budget ${kib(ROOT_BUDGET[key])}`);

for (const family of families) {
  const entry = await measure('@oxy.so/bloom-language', `@oxy.so/bloom-language/${family}`);
  const added = entry.inputs.filter((input) => !rootInputs.has(input));
  const reached = new Set(added.map(familyOf).filter(Boolean));
  reached.delete(family);
  const bloom = [...new Set(added.map(bloomOf).filter(Boolean))].sort();
  if (report)
    console.log(
      `${family}: +${kib(entry.bytes - root.bytes)} (gzip +${kib(entry.gzip - root.gzip)})` +
        `${reached.size ? `, families ${[...reached].join(' ')}` : ''}, Bloom ${bloom.join(' ')}`,
    );
  if (!entry.inputs.some((input) => familyOf(input) === family))
    problems.push(`${family}: its entry does not reach controls/${family}`);
}

if (problems.length) {
  console.error(problems.map((problem) => `- ${problem}`).join('\n'));
  process.exit(1);
}
console.log(`${families.length} family entries, each drawn only once imported`);
