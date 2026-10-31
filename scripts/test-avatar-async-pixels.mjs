import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const temporary = await mkdtemp('.local/avatar-async-pixels-');
await writeFile(
  `${temporary}/pixels.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/async-pixels.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { readPixelsAsync } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/pixels.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));
function context(mode) {
  const state = {
    deletedBuffers: 0,
    deletedFences: 0,
    polls: 0,
    readFramebuffer: { original: true },
    packBuffer: { original: true },
  };
  const gl = {
    READ_FRAMEBUFFER: 1,
    READ_FRAMEBUFFER_BINDING: 2,
    PIXEL_PACK_BUFFER: 3,
    PIXEL_PACK_BUFFER_BINDING: 4,
    WAIT_FAILED: 5,
    TIMEOUT_EXPIRED: 6,
    CONDITION_SATISFIED: 7,
    createBuffer: () => (mode === 'buffer-fail' ? null : { buffer: true }),
    deleteBuffer: () => state.deletedBuffers++,
    fenceSync: () => (mode === 'fence-fail' ? null : { sync: true }),
    deleteSync: () => state.deletedFences++,
    bindFramebuffer: (_target, value) => (state.readFramebuffer = value),
    bindBuffer: (_target, value) => (state.packBuffer = value),
    getParameter: (name) => (name === 2 ? state.readFramebuffer : state.packBuffer),
    bufferData() {},
    readPixels(...args) {
      assert.equal(args.at(-1), 0);
      if (mode === 'read-throw') throw Error('read rejected');
    },
    flush() {},
    isContextLost: () => mode === 'lost',
    clientWaitSync: () => {
      state.polls++;
      return mode === 'held' || mode === 'timeout' ? 6 : mode === 'wait-fail' ? 5 : 7;
    },
    getBufferSubData: (_target, _offset, pixels) => pixels.fill(17),
  };
  return { gl, state };
}
for (const mode of [
  'success',
  'buffer-fail',
  'fence-fail',
  'read-throw',
  'wait-fail',
  'lost',
  'held',
  'timeout',
])
  test(`web pixel readback: ${mode} restores bindings and releases every owned object`, async () => {
    const { gl, state } = context(mode),
      framebuffer = state.readFramebuffer,
      pack = state.packBuffer;
    const task = readPixelsAsync(gl, {}, 0, 0, 2, 2, mode === 'timeout' ? 1 : 30000);
    assert.equal(state.readFramebuffer, framebuffer);
    assert.equal(state.packBuffer, pack);
    if (mode === 'held') task.cancel();
    if (mode === 'success') assert.deepEqual(await task.promise, new Uint8Array(16).fill(17));
    else await assert.rejects(task.promise);
    task.cancel();
    task.cancel();
    assert.equal(state.deletedBuffers, mode === 'buffer-fail' ? 0 : 1);
    assert.equal(
      state.deletedFences,
      ['buffer-fail', 'fence-fail', 'read-throw'].includes(mode) ? 0 : 1,
    );
    const polls = state.polls;
    await new Promise((resolve) => setTimeout(resolve, 12));
    assert.equal(state.polls, polls);
    assert.equal(state.readFramebuffer, framebuffer);
    assert.equal(state.packBuffer, pack);
  });
