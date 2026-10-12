/** Return is a paired native tail plus an independently sampled semantic handoff. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import {
  proveReturn,
  compareSampledReturn,
  importSampler,
  presets,
  returnDestination,
  canonicalReturnPath,
} from './build-avatar-return-assets.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const manifest = await read(
  'runtime/avatar/assets/motion/computer-returns.json',
);
test('canonical return index contains all eight presets', () => {
  assert.equal(presets.length, 8);
  assert.deepEqual(Object.keys(manifest.presets).sort(), [...presets].sort());
});
test('filtered diagnostics cannot overwrite the canonical runtime return index', () => {
  assert.throws(
    () => returnDestination(['blue_beret']),
    /explicit AVATAR_RETURN_OUTPUT/,
  );
  assert.throws(
    () => returnDestination(['blue_beret'], canonicalReturnPath),
    /canonical index/,
  );
  assert.throws(
    () => returnDestination(['blue_beret'], resolve(canonicalReturnPath)),
    /canonical index/,
  );
  assert.throws(
    () => returnDestination(['blue_beret', 'blue_beret'], '.local/subset.json'),
    /unique/,
  );
  assert.throws(
    () => returnDestination(['unknown'], '.local/subset.json'),
    /Unknown/,
  );
  assert.equal(
    returnDestination(['blue_beret'], '.local/subset.json'),
    resolve('.local/subset.json'),
  );
  assert.equal(returnDestination(presets), resolve(canonicalReturnPath));
});
const Sampler = await importSampler();
for (const [preset, entry] of Object.entries(manifest.presets)) {
  test(`${preset}: full native tail and exported semantic handoff agree`, async () => {
    for (const source of Object.values(entry.sources))
      assert.equal(
        createHash('sha256')
          .update(await readFile(source.path))
          .digest('hex'),
        source.sha256,
      );
    const proof = proveReturn(
      await read(entry.sources.work.path),
      await read(entry.sources.idle.path),
    );
    assert(proof);
    for (const key of [
      'nativeStart',
      'nativeStop',
      'nativeReturn',
      'returnTime',
      'nativeEnd',
      'exactTailFrames',
      'previousNonmatchingTime',
    ])
      assert.equal(proof[key], entry[key], key);
    const work = await read(entry.sources.computer.path),
      idle = await read(entry.sources.motion.path);
    assert.equal(
      entry.idleTime,
      entry.nativeReturn - idle.evidence.idle.nativeStart,
    );
    assert.deepEqual(
      compareSampledReturn(
        Sampler,
        work.clip,
        idle.clips.idle,
        entry.returnTime,
        entry.idleTime,
      ),
      entry.sampler,
    );
  });
}
function fixture() {
  const raw = {
    fixedStep: 60,
    vertexBuffers: [{ id: 1, sha256: 'body' }],
    calls: [
      { method: 'applyActivity', args: [{ command: 1 }], renderTime: 0 },
      { method: 'applyActivity', args: [{ command: 2 }], renderTime: 0.2 },
    ],
    diagnostic: { activityMode: false, stoppingWork: false },
    frames: Array.from({ length: 121 }, (_, i) => ({
      renderTime: i / 60,
      draws: [
        {
          method: 'drawElements',
          defines: [],
          vertexAttributes: [{ name: 'position', bufferId: 1 }],
          blocks: { DrawBlock: [0, 1], FrameBlock: [2], SkinBlock: [0] },
        },
      ],
    })),
  };
  const work = structuredClone(raw);
  for (let i = 0; i < 30; i++) work.frames[i].draws[0].blocks.DrawBlock[0] = 1;
  return { work, idle: raw };
}
test('requires exact complete channels, not nearest pose or matching endpoint alone', () => {
  const { work, idle } = fixture();
  assert.equal(proveReturn(work, idle).returnTime, 0.5);
  work.frames.at(-1).draws[0].blocks.DrawBlock[1] += 1e-12;
  assert.equal(proveReturn(work, idle), null);
  work.frames.at(-1).draws[0].blocks.DrawBlock[1] = 1;
  work.frames.at(-2).draws[0].blocks.FrameBlock[0] += 1;
  assert.throws(() => proveReturn(work, idle), /at least one second/);
});
test('rejects missing tail frames, shader differences and unsettled native controller', () => {
  const { work, idle } = fixture();
  work.frames.splice(80, 1);
  assert.throws(() => proveReturn(work, idle), /missing tail samples/);
  const a = fixture();
  a.work.frames.at(-1).draws[0].defines = ['CHANGED'];
  assert.equal(proveReturn(a.work, a.idle), null);
  const b = fixture();
  b.work.diagnostic.stoppingWork = true;
  assert.throws(() => proveReturn(b.work, b.idle));
});
