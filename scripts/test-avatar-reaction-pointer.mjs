/** Offline public-API evidence. These tests do not claim cancellation interpolation is solved. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Matrix4 } from 'three';
const presets = [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
for (const preset of [...presets, 'blue_beret']) {
  test(`${preset}: held pointer rejects reaction; up/cancel restores acceptance`, async () => {
    for (const [scenario, expected] of [
      ['down-still', [3]],
      ['drag-held', [3, 0]],
      ['drag-cancel', [0]],
    ]) {
      const frames = await read(
        `.local/avatar-reaction-pointer/${preset}/arbitration/${scenario}-raw.json`,
      );
      const events = frames.flatMap((f) => f.events);
      assert.deepEqual(
        events.filter((e) => e.kind === 'reaction').map((e) => e.result),
        expected,
      );
      assert(events.some((e) => e.kind === 'pointer-down'));
      assert(
        events.some(
          (e) => e.kind === (scenario === 'drag-cancel' ? 'pointer-cancel' : 'pointer-up'),
        ),
      );
    }
  });
}
for (const preset of presets) {
  test(`${preset}: down preserves reaction; first move freezes pose with rigid drag`, async () => {
    const active = await read(
      `.local/avatar-reaction-pointer/${preset}/interrupt/reaction-drag-raw.json`,
    );
    const baseline = await read(
      `.local/avatar-eye-activities/${preset}/reaction-baseline-raw.json`,
    );
    for (let frame = 30; frame <= 33; frame++) {
      assert.equal(active[frame].time, baseline[frame].time);
      for (let part = 0; part < active[frame].draws.length; part++) {
        assert.deepEqual(
          active[frame].draws[part].blocks.DrawBlock,
          baseline[frame].draws[part].blocks.DrawBlock,
        );
      }
    }
    const basis = new Matrix4().makeRotationY((8 * Math.PI) / 180);
    const rotation = basis
      .clone()
      .multiply(new Matrix4().makeRotationY(Math.fround(0.32)))
      .multiply(new Matrix4().makeRotationX(Math.fround(-0.22)))
      .multiply(basis.clone().invert());
    let worldError = 0,
      normalRelativeError = 0;
    for (let part = 0; part < active[34].draws.length; part++) {
      const source = baseline[33].draws[part].blocks.DrawBlock;
      const actual = active[34].draws[part].blocks.DrawBlock;
      for (const offset of [0, 16]) {
        const expected = rotation
          .clone()
          .multiply(new Matrix4().fromArray(source.slice(offset, offset + 16)));
        const scale = offset ? Math.max(1, ...actual.slice(16, 32).map(Math.abs)) : 1;
        const error =
          Math.max(...expected.elements.map((v, i) => Math.abs(v - actual[offset + i]))) / scale;
        if (offset) normalRelativeError = Math.max(normalRelativeError, error);
        else worldError = Math.max(worldError, error);
      }
    }
    assert(worldError < 3e-7, `${preset}: world ${worldError}`);
    assert(normalRelativeError < 3e-7, `${preset}: normal ${normalRelativeError}`);
  });
}
test('Headphones60 cancellation reaches the exact paired pointer-only controller, not the remaining reaction', async () => {
  const active = await read(
    '.local/avatar-eye-activities/lime_headphones/reaction-input/reaction-active-pointer-raw.json',
  );
  const control = await read('.local/avatar-reaction-drag/lime_headphones/pointer-only-raw.json');
  let count = 0;
  for (const frame of active.filter((f) => f.time >= 1.3166666666666667)) {
    const paired = control.find((f) => f.renderTime === frame.renderTime);
    assert(paired, `Missing control ${frame.renderTime}`);
    assert.equal(frame.draws.length, paired.draws.length);
    for (let part = 0; part < frame.draws.length; part++) {
      assert.deepEqual(frame.draws[part].blocks, paired.draws[part].blocks);
    }
    count++;
  }
  assert.equal(count, 222);
});
