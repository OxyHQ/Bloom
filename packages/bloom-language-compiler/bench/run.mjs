#!/usr/bin/env node
// The compiler benchmarks over a tree from generate-tree.mjs:
//
//   node bench/run.mjs <tree-dir> <target-dir> <out.json>
//
// <target-dir> is the Cargo target directory holding release builds of
// `bloomc` and the `per_file` example (`cargo build --release -p bloomc
// --bin bloomc --example per_file`). Measured:
//
// - perFile: in-process compile time per file (median of runs), `.bloom`
//   through bloomc's core, and the equivalent TSX through the embedded pass;
// - bloomc: the whole tree through `bloomc build`, cold on one thread, cold
//   on every core, and warm (the cache, nothing changed); a process each;
// - host: the pipeline a host runs per module on one Node thread, the
//   addon then Babel's TypeScript preset: `.bloom` (compileBloom) against
//   TSX (the embedded pass), and TSX through Babel alone.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const [tree, target, outFile] = process.argv.slice(2);
if (!tree || !target || !outFile) {
  console.error('usage: run.mjs <tree-dir> <target-dir> <out.json>');
  process.exit(2);
}
const bloomc = join(target, 'release/bloomc');
const perFile = join(target, 'release/examples/per_file');
const RUNS = 5;

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const round = (n, digits = 2) => Number(n.toFixed(digits));

function files(dir, extensions) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext)))
      out.push(join(entry.parentPath, entry.name));
  }
  return out.sort();
}

const bloomFiles = files(join(tree, 'bloom'), ['.bloom']);
const tsxFiles = files(join(tree, 'tsx'), ['.ts', '.tsx']);

// ----- per file, in process -----
const kinds = ['models', 'rows', 'screens'];
const SAMPLE = 10;
const sample = (list, kind) => list.filter((f) => f.includes(`/${kind}/`)).slice(0, SAMPLE);
function perFileMedians(list) {
  const out = execFileSync(perFile, ['300', ...list], { encoding: 'utf8' });
  return out
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line).medianUs);
}
const perFileResult = {};
for (const kind of kinds) {
  perFileResult[kind] = {
    bloomMedianUs: round(median(perFileMedians(sample(bloomFiles, kind)))),
    tsxEmbeddedPassMedianUs: round(median(perFileMedians(sample(tsxFiles, kind)))),
  };
}

// ----- the tree through bloomc build -----
const out = join(tree, 'out');
function timedBuild(args) {
  const started = process.hrtime.bigint();
  execFileSync(bloomc, ['build', join(tree, 'bloom'), '--out', out, ...args], { stdio: 'pipe' });
  return Number(process.hrtime.bigint() - started) / 1e6;
}
function cold(args) {
  const times = [];
  for (let i = 0; i < RUNS; i++) {
    rmSync(out, { recursive: true, force: true });
    times.push(timedBuild(['--no-cache', ...args]));
  }
  return round(median(times), 1);
}
const cores = availableParallelism();
const coldSingleMs = cold(['--jobs', '1']);
const coldParallelMs = cold(['--jobs', String(cores)]);
rmSync(out, { recursive: true, force: true });
timedBuild([]);
const warmMs = round(median(Array.from({ length: RUNS }, () => timedBuild([]))), 1);
// One file changed: it and what imports it (transitively) rebuild.
const touched = bloomFiles.find((f) => f.includes('/models/Model0.bloom'));
const original = readFileSync(touched, 'utf8');
writeFileSync(touched, `${original}\n/// touched\n`);
const oneChangedMs = round(timedBuild([]), 1);
writeFileSync(touched, original);
rmSync(out, { recursive: true, force: true });

// ----- the host pipeline, one Node thread -----
const { compileBloomModule, compileModule, hostFilename } = require('../js/compile');
const babel = require('@babel/core');
const BABEL = {
  babelrc: false,
  configFile: false,
  presets: [require.resolve('@babel/preset-typescript')],
  sourceMaps: true,
};
const strip = (code, filename) => babel.transformSync(code, { ...BABEL, filename }).code;
const pipelines = {
  bloom: () => {
    for (const file of bloomFiles) {
      const { code } = compileBloomModule(readFileSync(file, 'utf8'), file);
      strip(code, hostFilename(file));
    }
  },
  tsx: () => {
    for (const file of tsxFiles) {
      const source = readFileSync(file, 'utf8');
      strip(compileModule(source, file)?.code ?? source, file);
    }
  },
  tsxBabelOnly: () => {
    for (const file of tsxFiles) strip(readFileSync(file, 'utf8'), file);
  },
};
const host = {};
for (const [name, run] of Object.entries(pipelines)) {
  run(); // warm Babel's caches and the JIT
  const times = Array.from({ length: RUNS }, () => {
    const started = process.hrtime.bigint();
    run();
    return Number(process.hrtime.bigint() - started) / 1e6;
  });
  host[`${name}Ms`] = round(median(times), 1);
}

const result = {
  date: new Date().toISOString(),
  files: { bloom: bloomFiles.length, tsx: tsxFiles.length },
  cores,
  perFile: perFileResult,
  bloomc: { coldSingleMs, coldParallelMs, warmMs, oneChangedMs },
  host,
};
mkdirSync(join(outFile, '..'), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
