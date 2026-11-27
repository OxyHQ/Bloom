#!/usr/bin/env node
// Emitted bytes: what a `.bloom` module ships against the TypeScript it replaces, through the
// pipeline a release build runs on each module:
//
//   node bench/bytes.mjs <app dir> [<a.bloom> <a.tsx>]…
//
// <app dir> is an Expo app whose toolchain is used (Mention's `packages/frontend`): its
// babel-preset-expo with the React Compiler on (as `reactCompiler: true` turns it on for app
// code), Metro's minifier (terser, module-scoped) and its `hermesc` (the bytecode a release
// APK ships). A `.bloom` file goes through bloomc first, a `.ts`/`.tsx` one through the embedded
// pass first, as the Metro transformer runs them. Without pairs, the cost gate's fixtures
// (`test/bloom/*.bloom` against their equivalents in `test/bloom/equivalents.ts`) are measured.
//
// Per module: minified bytes, gzip (level 9) of those, and Hermes bytecode bytes (`hermesc -O`,
// less an empty module's bytecode, so the file header is not counted). Prints JSON.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const [appDir, ...pairArgs] = process.argv.slice(2);
if (!appDir || pairArgs.length % 2 !== 0) {
  console.error('usage: bytes.mjs <app dir> [<a.bloom> <a.tsx>]…');
  process.exit(2);
}
const app = createRequire(join(resolve(appDir), 'package.json'));
const babel = app('@babel/core');
const terser = app('terser');
const hermesc = join(
  app.resolve('hermes-compiler/package.json'),
  '..',
  'hermesc',
  `${process.platform === 'darwin' ? 'osx' : 'linux64'}-bin`,
  'hermesc',
);
const { compileBloomModule, compileModule, hostFilename } = require('../js/compile');

const scratch = mkdtempSync(join(tmpdir(), 'bloom-bytes-'));

/** The module as Metro hands it to the minifier: Expo's preset, React Compiler on, CommonJS. */
function transform(code, filename) {
  return babel.transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    cwd: resolve(appDir),
    presets: [app.resolve('babel-preset-expo')],
    caller: {
      name: 'metro',
      bundler: 'metro',
      platform: 'android',
      isDev: false,
      isServer: false,
      supportsReactCompiler: true,
      supportsStaticESM: false,
      engine: 'hermes',
    },
  }).code;
}

/** Metro's module wrapper and terser, as a release bundle minifies each module. */
async function minify(code) {
  const wrapped = `__d(function(global,_$$_REQUIRE,_$$_IMPORT_DEFAULT,_$$_IMPORT_ALL,module,exports,_dependencyMap){${code}\n});`;
  const out = await terser.minify(wrapped, {
    compress: { passes: 2 },
    mangle: { toplevel: false },
    output: { ascii_only: true, comments: false },
  });
  return out.code;
}

function bytecode(code, name) {
  const js = join(scratch, `${name}.js`);
  const hbc = join(scratch, `${name}.hbc`);
  writeFileSync(js, code);
  execFileSync(hermesc, ['-O', '-w', '-emit-binary', '-out', hbc, js]);
  return statSync(hbc).size;
}
const emptyHbc = bytecode('__d(function(){});', 'empty');

async function measure(code, filename, name) {
  const min = await minify(transform(code, filename));
  if (process.env.BYTES_DUMP) writeFileSync(join(process.env.BYTES_DUMP, `${name}.min.js`), min);
  return {
    minified: Buffer.byteLength(min),
    gzip: gzipSync(min, { level: 9 }).length,
    hbc: bytecode(min, name) - emptyHbc,
  };
}

async function bloomModule(file) {
  const source = readFileSync(file, 'utf8');
  const { code } = compileBloomModule(source, file);
  return measure(code, hostFilename(file), basename(file));
}
async function tsModule(file, source = readFileSync(file, 'utf8')) {
  const code = compileModule(source, file)?.code ?? source;
  return measure(code, file, basename(file));
}

const sum = (rows) =>
  rows.reduce(
    (a, r) => ({ minified: a.minified + r.minified, gzip: a.gzip + r.gzip, hbc: a.hbc + r.hbc }),
    {
      minified: 0,
      gzip: 0,
      hbc: 0,
    },
  );

const result = { toolchain: { app: resolve(appDir) }, modules: [] };
if (pairArgs.length === 0) {
  // The fixtures: each `.bloom` module against its equivalent, split out of equivalents.ts with
  // the imports it uses, so each side is one module.
  const dir = join(import.meta.dirname, '..', 'test', 'bloom');
  const equivalents = readFileSync(join(dir, 'equivalents.ts'), 'utf8');
  const header = equivalents.slice(0, equivalents.indexOf('export const'));
  const bodies = equivalents.slice(header.length).split(/(?=^export const )/m);
  const byName = Object.fromEntries(bodies.map((b) => [b.match(/^export const (\w+)/)[1], b]));
  const fixtures = { counter: 'Counter', row: 'Row', static: 'Banner', list: 'Titled' };
  for (const [file, name] of Object.entries(fixtures)) {
    const bloom = await bloomModule(join(dir, `${file}.bloom`));
    const ts = await tsModule(join(dir, `${file}.equivalent.ts`), header + byName[name]);
    result.modules.push({ module: file, bloom, ts });
  }
} else {
  for (let i = 0; i < pairArgs.length; i += 2) {
    const bloom = await bloomModule(resolve(pairArgs[i]));
    const ts = await tsModule(resolve(pairArgs[i + 1]));
    result.modules.push({
      module: basename(pairArgs[i]),
      against: basename(pairArgs[i + 1]),
      bloom,
      ts,
    });
  }
}
result.total = {
  bloom: sum(result.modules.map((m) => m.bloom)),
  ts: sum(result.modules.map((m) => m.ts)),
};
rmSync(scratch, { recursive: true, force: true });
console.log(JSON.stringify(result, null, 2));
