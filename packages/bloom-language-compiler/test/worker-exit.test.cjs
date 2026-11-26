// node --test test/worker-exit.test.cjs: the addon survives the exits of the
// threads and processes it compiled in (jest-worker's and Metro's shapes).
//
// The `.bloom` compiler keeps per-thread caches (TS summaries, imported
// modules, route trees, token sets) that are never dropped, so a thread's or
// process's exit runs none of its code (`ThreadCache` in crates/lang/src/ts.rs).
// Each case here fills those caches and exits, in a loop: a worker that
// returns, a worker terminated mid-compile, and a child process that calls
// `process.exit()` while its workers still compile. A crash at exit fails the
// case with the signal (a segfault is SIGSEGV, a glibc abort SIGABRT).
//
// Every spawned process or thread runs this file with ROLE set and never
// spawns the loop again, and the loops are sequential: at most one child
// process and three workers at a time. `scripts/exit-stress.sh` also runs it
// inside a cgroup capped at 256 tasks, so a runaway cannot fill the machine.
'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { Worker, isMainThread } = require('node:worker_threads');

const FIXTURES = path.join(__dirname, '..', 'crates', 'lang', 'tests', 'fixtures', 'emit');
const FILES = ['records.bloom', 'catching.bloom', 'ts_components.bloom', 'rn_values.bloom'];
const ROLE = process.env.BLOOM_EXIT_ROLE;
/** `scripts/exit-stress.sh` runs the loops this many times longer. */
const LOOPS = Math.max(1, Number(process.env.BLOOM_EXIT_LOOPS) || 1);

function compileAll() {
  const native = require('../js/native');
  for (const name of FILES) {
    const file = path.join(FIXTURES, name);
    const output = native.compileBloom(fs.readFileSync(file, 'utf8'), file, { root: FIXTURES });
    if (output.diagnostics.length > 0)
      throw new Error(`${name}: ${output.diagnostics[0].rendered}`);
  }
}

function worker(role) {
  return new Worker(__filename, { env: { ...process.env, BLOOM_EXIT_ROLE: role } });
}

if (ROLE === 'once') {
  compileAll();
} else if (ROLE === 'spin') {
  for (;;) compileAll();
} else if (ROLE === 'exit-busy') {
  compileAll();
  for (let i = 0; i < 3; i++) worker('spin');
  setTimeout(() => process.exit(0), 5 + Math.random() * 30);
} else if (ROLE) {
  throw new Error(`unknown BLOOM_EXIT_ROLE ${ROLE}`);
} else if (isMainThread) {
  const test = require('node:test');

  /** Resolves with the worker's exit code. */
  const exited = (w) =>
    new Promise((resolve, reject) => {
      w.on('error', reject);
      w.on('exit', resolve);
    });

  test('workers that compile and return exit cleanly', async () => {
    for (let i = 0; i < 40 * LOOPS; i++)
      assert.equal(await exited(worker('once')), 0, `worker ${i}`);
  });

  test('workers terminated mid-compile exit cleanly', async () => {
    for (let i = 0; i < 20 * LOOPS; i++) {
      const w = worker('spin');
      setTimeout(() => w.terminate(), 5 + Math.random() * 30);
      await exited(w);
    }
  });

  test('a process that exits while its workers compile exits cleanly', () => {
    for (let i = 0; i < 15 * LOOPS; i++) {
      const run = childProcess.spawnSync(process.execPath, [__filename], {
        env: { ...process.env, BLOOM_EXIT_ROLE: 'exit-busy' },
        encoding: 'utf8',
        timeout: 60_000,
      });
      assert.equal(
        run.signal,
        null,
        `process ${i} died of ${run.signal}: ${run.stderr.slice(-600)}`,
      );
      assert.equal(run.status, 0, `process ${i}: ${run.stderr.slice(-600)}`);
    }
  });
}
