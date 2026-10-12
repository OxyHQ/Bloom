/** Actual original poses, exact seams, and return-to-idle contract for all
 * seven reconstructed custom-preset actions. No source-text assertions. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const temporary = await mkdtemp('.local/action-contract-');
await writeFile(
  `${temporary}/motion.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/motion.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/motion.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
for (const preset of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  test(`${preset}: action poses match the original and return to the exact idle phase`, async () => {
    const asset = await read(`runtime/avatar/assets/motion/${preset}.json`);
    const geometry = await read(`.local/avatar-original-geometry/${preset}/geometry.json`);
    const sourceIds = new Map(
      geometry.parts.flatMap((p) => [
        [p.vertices.sha256, `mesh:${p.id}`],
        ...(p.fur ? [[p.fur.sha256, `fur:${p.id}`]] : []),
      ]),
    );
    const samplers = {};
    for (const kind of ['idle', 'reaction']) {
      const sampler = (samplers[kind] = new AuthoredMotionSampler(asset.clips[kind])),
        pose = sampler.createPose();
      const raw = await read(`.local/avatar-runtime-motion-actions/${preset}/${kind}-raw.json`);
      const buffers = new Map(raw.vertexBuffers.map((b) => [b.id, sourceIds.get(b.sha256)]));
      const frames = new Map(raw.frames.map((f) => [f.renderTime.toFixed(9), f]));
      const absoluteStart = asset.evidence[kind].nativeStart;
      // Include the real LAST keyframe: a looping sampler normally wraps it.
      const finite = new AuthoredMotionSampler({ ...asset.clips[kind], loop: false });
      for (const time of sampler.clip.times) {
        finite.sample(time, pose);
        const frame = frames.get((absoluteStart + time).toFixed(9));
        assert(frame);
        const draws = new Map(
          frame.draws.map((d) => [
            buffers.get(d.vertexAttributes.find((a) => a.name === 'position').bufferId),
            d,
          ]),
        );
        for (const p of pose) {
          const values = draws.get(p.id).blocks.DrawBlock;
          assert(Math.max(...p.world.elements.map((v, k) => Math.abs(v - values[k]))) < 1e-6);
          assert(
            Math.max(...p.normalMatrix.elements.map((v, k) => Math.abs(v - values[16 + k]))) < 1e-6,
          );
          for (const [name, offset] of [
            ['parameters', 36],
            ['colorRoughness', 32],
            ['paletteClosure', 68],
            ['signatureDeform', 88],
          ])
            assert(
              Math.max(...p.fields[name].map((v, k) => Math.abs(v - values[offset + k]))) < 1e-8,
            );
        }
      }
    }
    const a = samplers.idle.createPose(),
      b = samplers.reaction.createPose();
    samplers.reaction.sample(samplers.reaction.clip.duration, b);
    samplers.idle.sample(asset.evidence.reaction.nativeEnd - asset.evidence.idle.nativeStart, a);
    for (let i = 0; i < a.length; i++) {
      assert(
        Math.max(...a[i].world.elements.map((v, k) => Math.abs(v - b[i].world.elements[k]))) <
          1e-12,
      );
      assert.deepEqual(a[i].fields, b[i].fields);
    }
    const finiteIdle = new AuthoredMotionSampler({ ...asset.clips.idle, loop: false });
    finiteIdle.sample(0, a);
    finiteIdle.sample(finiteIdle.clip.duration, b);
    assert.deepEqual(a, b, 'Every part and material must agree at the seam');
    assert.equal(asset.evidence.idle.seamError, 0);
    assert(asset.evidence.reaction.exactIdleTailSeconds >= 1);
  });
}
