import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { AvatarBreathing } from '../runtime/avatar/breathing.ts';
for (const preset of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  test(`${preset}: independently calculated breathing matches every native idle presentation`, async () => {
    const raw = JSON.parse(
      await readFile(`.local/avatar-runtime-motion-actions/${preset}/idle-raw.json`),
    );
    const clock = new AvatarBreathing(),
      pose = { y: 0, scaleY: 0, scaleXZ: 0 };
    let exact = 0,
      maxY = 0,
      maxScale = 0;
    for (const frame of raw.frames) {
      clock.sample(frame.renderTime - 1 / 60, pose);
      const world = frame.draws[0].blocks.DrawBlock;
      maxY = Math.max(maxY, Math.abs(pose.y - world[13]));
      maxScale = Math.max(maxScale, Math.abs(pose.scaleY - world[5]));
      if (pose.y === world[13] && pose.scaleY === world[5]) exact++;
    }
    console.log(JSON.stringify({ preset, frames: raw.frames.length, exact, maxY, maxScale }));
    assert.equal(maxY, 0);
    assert.equal(maxScale, 0);
  });
}
test('breathing clock is deterministic beyond the captured interval and accepts no invalid time/seed', () => {
  const clock = new AvatarBreathing(),
    a = { y: 0, scaleY: 0, scaleXZ: 0 },
    b = { ...a };
  assert.equal(clock.period, 5.954691362380982);
  for (const t of [0, 123.123, 100000]) {
    clock.sample(t, a);
    new AvatarBreathing().sample(t, b);
    assert.deepEqual(a, b);
    assert(a.scaleY >= 0.9969 && a.scaleY <= 1.0031);
    assert(Math.abs(a.y) <= 0.00101);
  }
  for (const t of [-1, NaN, Infinity]) assert.throws(() => clock.sample(t, a));
  for (const seed of [-1, 1.2, NaN, 2 ** 32]) assert.throws(() => new AvatarBreathing(seed));
});
