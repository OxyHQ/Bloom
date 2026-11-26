// node --test test/cli.test.cjs: `bloomc` and `bloom-lang-check` from npm, the
// shims over the bloomc binary (the checkout's build: `bun run build:addon`).
// BLOOMC_WASM names a WASI build (scripts/build-cli.sh wasm32-wasip1) to run
// the same through Node's WASI; CI's install job runs the packed one.
'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const BLOOMC = path.join(ROOT, 'js', 'bloomc.js');
const CHECK = path.join(ROOT, 'js', 'check.js');
const TSC_PROJECT = path.join(ROOT, 'crates', 'bloomc', 'tests', 'tsc-project');
const BLOOM = path.join(__dirname, 'bloom');

const node = (script, args, cwd = ROOT) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });

test('npx bloomc runs the checkout’s bloomc with its arguments and exit code', () => {
  const { locate } = require('../js/bloomc');
  assert.deepEqual(locate(), {
    kind: 'native',
    file: path.join(ROOT, process.platform === 'win32' ? 'bloomc.exe' : 'bloomc'),
  });
  const help = node(BLOOMC, ['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /bloomc check \[--tsc\]/);
  const checked = node(BLOOMC, ['check', '.'], BLOOM);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stderr, /bloomc: checked \d+ files \(0 errors/);
  assert.equal(node(BLOOMC, ['nonsense']).status, 2);
});

test('bloom-lang-check --tsc reports a planted boundary error at its .bloom span, and fails', () => {
  const run = node(CHECK, ['--tsc', '--project', TSC_PROJECT], __dirname);
  assert.equal(run.status, 1, run.stderr);
  assert.match(
    run.stderr,
    /error\[B0620\]: TS2345: Argument of type 'string' is not assignable to parameter of type 'Date'\./,
  );
  assert.match(run.stderr, /--> \S*tsc-project\/src\/screens\/stamp\.bloom:4:33\n/);
  // The fixtures' 0.x forms warn (B0950); the one error is tsc's.
  assert.match(run.stderr, /checked 5 files with tsc \(1 error, \d+ warnings?\)/);
});

test('the WASI bloomc checks the same files from the working directory', {
  skip: !process.env.BLOOMC_WASM && 'BLOOMC_WASM is not set',
}, async () => {
  const { runWasi } = require('../js/bloomc');
  const wasm = path.resolve(process.env.BLOOMC_WASM);
  assert.ok(fs.existsSync(wasm), wasm);
  const probe = `require(${JSON.stringify(BLOOMC)}).runWasi(${JSON.stringify(wasm)}, ['check', '.'], process.cwd()).then((c) => { process.exitCode = c; })`;
  const run = spawnSync(process.execPath, ['-e', probe], { cwd: BLOOM, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stderr, /bloomc: checked \d+ files \(0 errors/);
  assert.equal(typeof runWasi, 'function');
});
