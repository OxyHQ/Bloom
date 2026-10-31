import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const temporary = await mkdtemp('.local/avatar-pose-sharing-');
for (const name of ['motion', 'pose-sharing'])
  await writeFile(
    `${temporary}/${name}.mjs`,
    ts.transpileModule(await readFile(`runtime/avatar/${name}.ts`, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText,
  );
const moduleAt = (name) => import(pathToFileURL(`${process.cwd()}/${temporary}/${name}.mjs`).href);
const { AuthoredMotionSampler } = await moduleAt('motion');
const { AvatarPoseSharing } = await moduleAt('pose-sharing');
test.after(() => rm(temporary, { recursive: true, force: true }));
const presets = [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const documents = await Promise.all(
  presets.map(async (preset) => ({
    preset,
    motion: JSON.parse(await readFile(`runtime/avatar/assets/motion/${preset}.json`, 'utf8')),
    work: JSON.parse(
      await readFile(`runtime/avatar/assets/${preset}/computer-motion.json`, 'utf8'),
    ),
  })),
);
const liveClip = (clip) => ({
  ...clip,
  parts: clip.parts.filter((part) => !part.id.startsWith('fur:')),
});

for (const { preset, motion, work } of documents)
  test(`${preset}: exact fields and private outputs at identical clocks`, () => {
    for (const clip of [motion.clips.idle, motion.clips.reaction, work.clip]) {
      const sampler = new AuthoredMotionSampler(liveClip(clip));
      const sharing = new AvatarPoseSharing();
      const targets = Array.from({ length: 4 }, () => sampler.createPose());
      const reference = sampler.createPose();
      for (const time of [0, 1 / 60, 0.371, clip.duration / 2, clip.duration + 0.123]) {
        sharing.beginFrame();
        for (const _ of targets) sharing.register(sampler, time);
        sampler.sample(time, reference);
        for (const target of targets) {
          sharing.sample(sampler, time, target);
          assert.deepEqual(target, reference);
          // A consumer may alter its own eye/gaze/retarget output. Neither the
          // private cache nor the next avatar may inherit any of those writes.
          for (const part of target) {
            part.world.elements.fill(123);
            part.normalMatrix.elements.fill(-456);
            for (const values of Object.values(part.fields)) values.fill(789);
          }
        }
        assert.equal(sharing.evaluations, 1);
        assert.equal(sharing.copies, targets.length);
      }
    }
  });

test('independent clocks and adjacent floating-point times take the direct path', () => {
  const sampler = new AuthoredMotionSampler(liveClip(documents[0].motion.clips.idle));
  const sharing = new AvatarPoseSharing();
  const times = [0.5, 0.5 + Number.EPSILON, ...Array.from({ length: 22 }, (_, i) => i * 0.173)];
  sharing.beginFrame();
  for (const time of times) sharing.register(sampler, time);
  for (const time of times) {
    const target = sampler.createPose(),
      reference = sampler.createPose();
    sharing.sample(sampler, time, target);
    sampler.sample(time, reference);
    assert.deepEqual(target, reference);
  }
  assert.equal(sharing.evaluations, times.length);
  assert.equal(sharing.copies, 0);
});

test('cache lifetime is one frame and sampler identity, never matching names or historical time', () => {
  const a = new AuthoredMotionSampler(liveClip(documents[0].motion.clips.idle));
  const b = new AuthoredMotionSampler(liveClip(documents[1].motion.clips.idle));
  const sharing = new AvatarPoseSharing();
  sharing.beginFrame();
  sharing.register(a, 0.5);
  sharing.register(a, 0.5);
  sharing.sample(a, 0.5, a.createPose());
  sharing.sample(a, 0.5, a.createPose());
  assert.equal(sharing.evaluations, 1);
  sharing.beginFrame();
  sharing.register(a, 0.5);
  sharing.register(b, 0.5);
  const one = a.createPose(),
    two = b.createPose();
  sharing.sample(a, 0.5, one);
  sharing.sample(b, 0.5, two);
  const expected = b.createPose();
  b.sample(0.5, expected);
  assert.deepEqual(two, expected);
  assert.equal(sharing.evaluations, 2);
  assert.equal(sharing.copies, 0);
});

if (process.env.AVATAR_POSE_BENCHMARK)
  test('report exact-clock sampler microbenchmarks', async () => {
    const samplers = documents.map(
      ({ motion }) => new AuthoredMotionSampler(liveClip(motion.clips.idle)),
    );
    const results = [];
    for (const mode of ['same', 'mixed', 'independent', 'single']) {
      const count = mode === 'single' ? 1 : 24;
      const selected = Array.from(
        { length: count },
        (_, i) => samplers[mode === 'mixed' ? i % samplers.length : 0],
      );
      const targets = selected.map((sampler) => sampler.createPose());
      const sharing = new AvatarPoseSharing();
      const times = new Float64Array(count);
      const run = (shared, frames) => {
        const start = performance.now();
        for (let frame = 0; frame < frames; frame++) {
          if (shared) sharing.beginFrame();
          for (let i = 0; i < count; i++) {
            times[i] = frame / 60 + (mode === 'independent' ? i * 0.173 : 0);
            if (shared) sharing.register(selected[i], times[i]);
          }
          for (let i = 0; i < count; i++) {
            if (shared) sharing.sample(selected[i], times[i], targets[i]);
            else selected[i].sample(times[i], targets[i]);
          }
        }
        return performance.now() - start;
      };
      run(false, 150);
      run(true, 150);
      const direct = [],
        shared = [];
      for (let repeat = 0; repeat < 6; repeat++) {
        if (repeat % 2) {
          shared.push(run(true, 600));
          direct.push(run(false, 600));
        } else {
          direct.push(run(false, 600));
          shared.push(run(true, 600));
        }
      }
      results.push({
        mode,
        avatars: count,
        frames: 600,
        directMs: direct,
        sharedMs: shared,
        evaluationsPerFrame: sharing.evaluations,
        copiesPerFrame: sharing.copies,
      });
    }
    const report = {
      environment: `Node ${process.version} ${process.platform}/${process.arch}`,
      scope:
        'Sampler and exact-pose copies only; not renderer time, FPS, GPU work or device performance. All runs include clock registration overhead; alternating order after warmup.',
      results,
    };
    await writeFile(process.env.AVATAR_POSE_BENCHMARK, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  });
