import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Matrix4 } from 'three';
import { ReactionCancellationBody } from '../runtime/avatar/reaction-cancel.ts';
import { AvatarPointerController } from '../runtime/avatar/pointer-controller.ts';
import { AvatarGazeController } from '../runtime/avatar/gaze-controller.ts';
import { ReactionGazeComposer } from '../runtime/avatar/reaction-gaze.ts';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const smooth = (v) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * t * (10 - 15 * t + 6 * t * t);
};
for (const preset of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  test(`${preset}: semantic cancellation body matches native world AND normal`, async () => {
    const active = await read(
      `.local/avatar-reaction-pointer/${preset}/interrupt/reaction-drag-raw.json`,
    );
    const baseline = await read(
      `.local/avatar-eye-activities/${preset}/reaction-baseline-raw.json`,
    );
    const idle = await read(`.local/avatar-pointer-validation/${preset}/idle-raw.json`);
    const geometry = await read(`runtime/avatar/assets/${preset}/geometry-low.json`);
    const body = new ReactionCancellationBody(
      new Matrix4().fromArray(baseline[33].draws[0].blocks.DrawBlock),
      geometry.parts.find((p) => p.id === 0).bounds.min[1],
    );
    const pointer = new AvatarPointerController(),
      gaze = new AvatarGazeController(),
      compose = new ReactionGazeComposer();
    const delta = new Matrix4(),
      normal = new Matrix4();
    let previous = 0,
      count = 0,
      maxWorld = 0,
      maxNormal = 0;
    for (const frame of active) {
      const t = frame.time;
      pointer.sample(t);
      if (t >= 34 / 30 && t <= 40 / 30) {
        const paired = idle.find((f) => f.renderTime === frame.renderTime);
        assert(paired);
        const u = smooth((t - 34 / 30) / 0.18);
        body.sample(new Matrix4().fromArray(paired.draws[0].blocks.DrawBlock), u);
        compose.writeBodyCorrection(
          pointer.yaw + gaze.yaw * u,
          pointer.pitch + gaze.pitch * u,
          body.neutralTranslation.toArray(),
          delta,
          normal,
        );
        const w = delta.clone().multiply(body.world),
          n = normal.clone().multiply(body.normal),
          actual = frame.draws[0].blocks.DrawBlock;
        maxWorld = Math.max(maxWorld, ...w.elements.map((v, i) => Math.abs(v - actual[i])));
        const magnitude = Math.max(1, ...actual.slice(16, 32).map(Math.abs));
        maxNormal = Math.max(
          maxNormal,
          ...n.elements.map((v, i) => Math.abs(v - actual[i + 16]) / magnitude),
        );
        count++;
      }
      gaze.advance(t - previous);
      previous = t;
      for (const event of frame.events) {
        if (event.kind === 'pointer-down') pointer.down(event.x, event.y, t);
        else if (event.kind === 'pointer') pointer.move(event.x, event.y);
        else if (event.kind === 'pointer-up' || event.kind === 'pointer-cancel') pointer.up(t);
        if (event.kind.startsWith('pointer')) gaze.point(event.x, event.y);
      }
    }
    assert.equal(count, 7);
    assert(maxWorld < 3e-7, `world ${maxWorld}`);
    assert(maxNormal < 3e-7, `normal ${maxNormal}`);
  });
}
test('invalid reflected, singular and non-core affine snapshots reject', () => {
  for (const m of [
    new Matrix4().makeScale(-1, 1, 1),
    new Matrix4().makeScale(0, 1, 1),
    new Matrix4().makeShear(0.1, 0, 0, 0, 0, 0),
  ])
    assert.throws(() => new ReactionCancellationBody(m, -1));
  const body = new ReactionCancellationBody(new Matrix4().makeRotationY((8 * Math.PI) / 180), -1);
  assert.throws(() => body.sample(new Matrix4(), NaN));
  assert.throws(() => body.sample(new Matrix4(), 1.1));
});

for (const preset of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  test(`${preset}: complete cancellation pose matches every native world, normal and material channel`, async () => {
    const { reactionCancellationFixtures } = await import('./avatar-reaction-cancel-fixtures.mjs');
    const cases = await reactionCancellationFixtures(preset);
    assert.equal(cases.length, 7);
    for (const c of cases) {
      assert(c.metrics.worldError < 3e-7, `${preset}@${c.time} world ${c.metrics.worldError}`);
      assert(c.metrics.normalError < 3e-7, `${preset}@${c.time} normal ${c.metrics.normalError}`);
      assert(c.metrics.fieldError < 3e-7, `${preset}@${c.time} fields ${c.metrics.fieldError}`);
    }
  });
}

for (const preset of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  for (const scenario of ['entry', 'exit'])
    test(`${preset}: ${scenario} drag native semantic pose`, async () => {
      const { reactionCancellationFixtures } = await import(
        './avatar-reaction-cancel-fixtures.mjs'
      );
      const cases = await reactionCancellationFixtures(preset, scenario);
      assert.equal(cases.length, 7);
      for (const c of cases) {
        assert(c.metrics.worldError < 3e-7, `${scenario} world ${c.metrics.worldError}`);
        assert(c.metrics.normalError < 3e-7, `${scenario} normal ${c.metrics.normalError}`);
        assert(c.metrics.fieldError < 3e-7, `${scenario} fields ${c.metrics.fieldError}`);
      }
    });
}

test('Headphones entry cancellation preserves incoming XY gaze and does not restart on a second move', async () => {
  const { reactionCancellationFixtures } = await import('./avatar-reaction-cancel-fixtures.mjs');
  const cases = await reactionCancellationFixtures('lime_headphones', 'entry-gaze');
  assert.equal(cases.length, 7);
  for (const c of cases) {
    assert(c.metrics.worldError < 3e-7, `world ${c.metrics.worldError}`);
    assert(c.metrics.normalError < 3e-7, `normal ${c.metrics.normalError}`);
    assert(c.metrics.fieldError < 3e-7, `fields ${c.metrics.fieldError}`);
  }
});

test('sampling reuses output storage and never clones matrices or enumerates fields', async () => {
  const { ReactionCancellationPose } = await import('../runtime/avatar/reaction-cancel.ts');
  const world = new Matrix4().makeRotationY((8 * Math.PI) / 180);
  const pose = [0, 1].map((id) => ({
    id: `mesh:${id}`,
    world: world.clone(),
    normalMatrix: world.clone(),
    fields: { signatureDeform: [0, 0, 0, 0] },
  }));
  const model = new ReactionCancellationPose(pose, {
    groundY: -1,
    pivots: { 0: [0, 0, 0], 1: [0, 0.2, 0] },
  });
  const output = model.sample(pose, 0);
  const matrix = output[1].world,
    field = output[1].fields.signatureDeform;
  const clone = Matrix4.prototype.clone,
    entries = Object.entries;
  try {
    Matrix4.prototype.clone = () => {
      throw new Error('Per-frame matrix allocation');
    };
    Object.entries = () => {
      throw new Error('Per-frame field enumeration');
    };
    assert.equal(model.sample(pose, 0.5), output);
    assert.equal(model.sample(pose, 1), output);
    assert.equal(output[1].world, matrix);
    assert.equal(output[1].fields.signatureDeform, field);
  } finally {
    Matrix4.prototype.clone = clone;
    Object.entries = entries;
  }
});
