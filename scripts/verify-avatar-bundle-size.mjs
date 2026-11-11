/**
 * Bundle-size guard for the avatar vector catalog. Bundles the BUILT package (`lib/module`) the way an
 * app's web export does (code splitting, minified, production) and fails when a budget is exceeded:
 *
 *   default  Avatar with Bloom's full catalog: what every app that does nothing ships.
 *   opt-out  The same, built with EXPO_PUBLIC_BLOOM_AVATAR_CATALOG=none and three assets listed
 *            through `createVectorAssetLoader`: what an app that draws one character ships.
 *   native   The same two, as a Metro (Hermes) iOS bundle of the package SOURCE placed inside a
 *            node_modules directory, which is how an app consumes it. The opt-out there is the
 *            `resolveRequest` snippet from docs/agent-avatar.mdx: Metro inlines no env var in node_modules.
 *
 * Budgets are raw bytes of emitted JavaScript (JSON assets included) with ~5% headroom over the
 * measurement in docs/agent-avatar.mdx. Raise one only with a reason in the commit; the point is that a
 * catalog that grows, or an import that drags it into the first chunk, fails here and not in an app.
 *
 *   node scripts/verify-avatar-bundle-size.mjs [--report]   (after `bun run build`)
 */
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const lib = (path) => resolve(root, 'lib/module', path);
const MiB = 1024 * 1024;

const SCENARIOS = {
  default: {
    entry: `import { Avatar } from ${JSON.stringify(lib('avatar/index.js'))}; console.log(Avatar);`,
    define: {},
    budget: {
      initial: 0.14 * MiB,
      initialGzip: 0.05 * MiB,
      total: 32.8 * MiB,
      totalGzip: 7.5 * MiB,
    },
  },
  'opt-out': {
    entry: [
      `import { Avatar } from ${JSON.stringify(lib('avatar/index.js'))};`,
      `import { createVectorAssetLoader } from ${JSON.stringify(lib('agent-avatar/catalog/index.js'))};`,
      `import circle from ${JSON.stringify(lib('agent-avatar/catalog/shape-circle.js'))};`,
      `import oval from ${JSON.stringify(lib('agent-avatar/catalog/eyes-oval.js'))};`,
      `import clippo from ${JSON.stringify(lib('agent-avatar/catalog/template-clippo.js'))};`,
      `console.log(Avatar, createVectorAssetLoader({ shape: { circle }, eyes: { oval }, template: { clippo } }));`,
    ].join('\n'),
    define: { 'process.env.EXPO_PUBLIC_BLOOM_AVATAR_CATALOG': '"none"' },
    budget: {
      initial: 0.14 * MiB,
      initialGzip: 0.06 * MiB,
      total: 4.3 * MiB,
      totalGzip: 1.0 * MiB,
    },
  },
};

async function measure(name, { entry, define }) {
  const dir = mkdtempSync(join(tmpdir(), `bloom-bundle-${name}-`));
  try {
    mkdirSync(dir, { recursive: true });
    const entryFile = join(dir, 'entry.js');
    writeFileSync(entryFile, entry);
    const result = await build({
      entryPoints: [entryFile],
      absWorkingDir: root,
      outdir: join(dir, 'out'),
      bundle: true,
      splitting: true,
      format: 'esm',
      minify: true,
      platform: 'browser',
      packages: 'external',
      metafile: true,
      write: true,
      logLevel: 'error',
      loader: { '.js': 'jsx', '.woff2': 'file', '.png': 'file', '.svg': 'file', '.ttf': 'file' },
      define: {
        __DEV__: 'false',
        'process.env.NODE_ENV': '"production"',
        'process.env.EXPO_OS': '"web"',
        ...define,
      },
    });
    const outputs = Object.entries(result.metafile.outputs).filter(([file]) =>
      file.endsWith('.js'),
    );
    const entryOutput = outputs.find(([, output]) => output.entryPoint?.endsWith('entry.js'));
    const initial = new Set([entryOutput[0]]);
    const queue = [entryOutput[0]];
    while (queue.length) {
      for (const link of result.metafile.outputs[queue.pop()].imports) {
        if (link.kind === 'import-statement' && !link.external && !initial.has(link.path)) {
          initial.add(link.path);
          queue.push(link.path);
        }
      }
    }
    const sum = { initial: 0, initialGzip: 0, total: 0, totalGzip: 0, lazyChunks: 0 };
    for (const [file] of outputs) {
      const bytes = readFileSync(resolve(root, file));
      const gzip = gzipSync(bytes).length;
      sum.total += bytes.length;
      sum.totalGzip += gzip;
      if (initial.has(file)) {
        sum.initial += bytes.length;
        sum.initialGzip += gzip;
      } else sum.lazyChunks++;
    }
    return sum;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** One Metro bundle (bytes) of `entry`, with the consumer's Metro config `resolver` snippet when given. */
function metroBundle(name, entry, optOut) {
  const dir = mkdtempSync(join(root, '.local/', `metro-${name}-`));
  try {
    const modules = join(dir, 'node_modules/bloom');
    mkdirSync(modules, { recursive: true });
    cpSync(resolve(root, 'src'), join(modules, 'src'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{"name":"metro-guard","version":"1.0.0"}');
    writeFileSync(
      join(dir, 'babel.config.js'),
      "module.exports = { presets: ['babel-preset-expo'] };",
    );
    writeFileSync(
      join(dir, 'metro.config.js'),
      [
        "const { getDefaultConfig } = require('expo/metro-config');",
        `const config = getDefaultConfig(${JSON.stringify(dir)});`,
        `config.watchFolders = [${JSON.stringify(root)}];`,
        `config.resolver.nodeModulesPaths = [${JSON.stringify(join(root, 'node_modules'))}];`,
        optOut
          ? [
              'const upstream = config.resolver.resolveRequest;',
              'config.resolver.resolveRequest = (context, moduleName, platform) =>',
              "  moduleName === './vector-assets' && /agent-avatar[\\\\/]default-catalog\\.(ts|js)$/.test(context.originModulePath)",
              "    ? { type: 'empty' }",
              '    : (upstream ?? context.resolveRequest)(context, moduleName, platform);',
            ].join('\n')
          : '',
        'module.exports = config;',
      ].join('\n'),
    );
    writeFileSync(join(dir, 'index.js'), entry.replaceAll('@bloom/', 'bloom/src/'));
    const out = join(dir, 'bundle.js');
    const run = spawnSync(
      resolve(root, 'node_modules/.bin/expo'),
      [
        'export:embed',
        '--platform',
        'ios',
        '--entry-file',
        'index.js',
        '--bundle-output',
        out,
        '--dev',
        'false',
        '--minify',
        'true',
        '--assets-dest',
        join(dir, 'assets'),
        '--reset-cache',
      ],
      { cwd: dir, encoding: 'utf8', env: { ...process.env, EXPO_NO_TELEMETRY: '1', CI: '1' } },
    );
    if (run.status !== 0) throw Error(`Metro bundle ${name} failed:\n${run.stdout}\n${run.stderr}`);
    return statSync(out).size;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const fmt = (bytes) => `${(bytes / MiB).toFixed(2)} MiB`;
const problems = [];
for (const [name, scenario] of Object.entries(SCENARIOS)) {
  const sum = await measure(name, scenario);
  console.log(
    `${name}: initial ${fmt(sum.initial)} (gzip ${fmt(sum.initialGzip)}), total ${fmt(sum.total)} ` +
      `(gzip ${fmt(sum.totalGzip)}), ${sum.lazyChunks} lazy chunks`,
  );
  for (const key of ['initial', 'initialGzip', 'total', 'totalGzip'])
    if (sum[key] > scenario.budget[key])
      problems.push(
        `${name}: ${key} ${fmt(sum[key])} exceeds the budget ${fmt(scenario.budget[key])}`,
      );
}
const NATIVE_ENTRY = [
  "import { AppRegistry } from 'react-native';",
  "import { Avatar } from '@bloom/avatar';",
  'AppRegistry.registerComponent("guard", () => Avatar);',
].join('\n');
const NATIVE_OPT_OUT_ENTRY = [
  NATIVE_ENTRY,
  "import { createVectorAssetLoader } from '@bloom/agent-avatar/catalog';",
  "import circle from '@bloom/agent-avatar/catalog/shape-circle';",
  "import oval from '@bloom/agent-avatar/catalog/eyes-oval';",
  "import clippo from '@bloom/agent-avatar/catalog/template-clippo';",
  'export const catalog = createVectorAssetLoader({ shape: { circle }, eyes: { oval }, template: { clippo } });',
].join('\n');
mkdirSync(resolve(root, '.local'), { recursive: true });
for (const [name, entry, optOut, budget] of [
  ['native default', NATIVE_ENTRY, false, 35.3 * MiB],
  ['native opt-out', NATIVE_OPT_OUT_ENTRY, true, 6.7 * MiB],
]) {
  const bytes = metroBundle(name.replace(' ', '-'), entry, optOut);
  console.log(`${name}: Hermes bundle ${fmt(bytes)}`);
  if (bytes > budget) problems.push(`${name}: ${fmt(bytes)} exceeds the budget ${fmt(budget)}`);
}
if (problems.length) throw Error(problems.join('\n'));
console.log('Avatar bundle budgets: ok');
