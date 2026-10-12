import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { encodeMotionBinary } from './build-avatar-motion-binary.mjs';

const temporary = await mkdtemp('.local/motion-binary-test-');
for (const file of ['motion-binary', 'motion', 'eye-blink', 'reaction-gaze-data'])
  await writeFile(
    `${temporary}/${file}.mjs`,
    ts.transpileModule(await readFile(`runtime/avatar/${file}.ts`, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText,
  );
const { decodeMotionBinary } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/motion-binary.mjs`)
);
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/motion.mjs`)
);
const { attachEyeBlink } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/eye-blink.mjs`)
);
const { attachReactionGaze } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/reaction-gaze-data.mjs`)
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const buffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

test('lossless doubles, metadata, and duplicate channels share the original binary storage', () => {
  const values = [0, -0, Number.MIN_VALUE, Number.MAX_VALUE, Math.PI, 1 + Number.EPSILON];
  const bytes = buffer(
    encodeMotionBinary({ values, copy: [...values], empty: [], text: 'pelo azul', flag: false }),
  );
  const result = decodeMotionBinary(bytes);
  assert(result.values instanceof Float64Array);
  values.forEach((v, i) => assert(Object.is(v, result.values[i]), `Exact double ${i}`));
  assert.equal(result.values.buffer, bytes);
  assert.equal(result.values, result.copy, 'Duplicate channels share the same view');
  assert.deepEqual(result.empty, []);
  assert.equal(result.text, 'pelo azul');
  assert.equal(result.flag, false);
});

test('invalid headers, truncation, and channel ranges fail before constructing motion samplers', () => {
  assert.throws(() => decodeMotionBinary(new ArrayBuffer(0)), /header/);
  const good = buffer(encodeMotionBinary({ x: [1, 2, 3] }));
  const badMagic = good.slice(0);
  new Uint8Array(badMagic)[0] = 0;
  assert.throws(() => decodeMotionBinary(badMagic), /header/);
  assert.throws(() => decodeMotionBinary(good.slice(0, -1)), /length/);
  const badRange = good.slice(0);
  const text = new TextDecoder().decode(
    new Uint8Array(badRange, 16, new DataView(badRange).getUint32(8, true)),
  );
  const changed = text.replace('[0,3]', '[9,3]');
  assert.notEqual(text, changed);
  new Uint8Array(badRange, 16, changed.length).set(new TextEncoder().encode(changed));
  assert.throws(() => decodeMotionBinary(badRange), /range/);
  assert.throws(() => encodeMotionBinary({ x: [NaN] }), /finite/);
  assert.throws(() => encodeMotionBinary({ $motionF64: [0, 1] }), /Reserved/);
});

function identical(expected, actual, path = 'bundle') {
  if (Array.isArray(expected)) {
    assert.equal(actual.length, expected.length, `${path} length`);
    if (expected.length && expected.every((n) => typeof n === 'number')) {
      assert(actual instanceof Float64Array, `${path} uses binary storage`);
      for (let i = 0; i < expected.length; i++)
        assert(Object.is(actual[i], expected[i]), `${path}[${i}]`);
    } else expected.forEach((child, i) => identical(child, actual[i], `${path}[${i}]`));
  } else if (expected && typeof expected === 'object') {
    assert.deepEqual(Object.keys(actual), Object.keys(expected), `${path} keys`);
    for (const [key, value] of Object.entries(expected))
      identical(value, actual[key], `${path}.${key}`);
  } else assert.equal(actual, expected, path);
}

for (const preset of [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]) {
  test(`${preset}: every packed number and sampled pose agrees exactly with the authored JSON`, async () => {
    const root = 'runtime/avatar/assets';
    const motionBytes = await readFile(`${root}/motion/${preset}.json`);
    const computerBytes = await readFile(`${root}/${preset}/computer-motion.json`);
    const loopBytes = await readFile(`${root}/${preset}/computer-loop.json`);
    const original = {
      schema: 'bloom.avatar.motion-bundle',
      version: 1,
      preset,
      motion: JSON.parse(motionBytes),
      computer: JSON.parse(computerBytes),
    };
    if (preset === 'lime_headphones')
      original.eyeBlink = JSON.parse(
        await readFile(`${root}/motion/lime-headphones-eye-blink.json`, 'utf8'),
      );
    if (preset !== 'blue_beret')
      original.reactionGaze = JSON.parse(
        await readFile(`${root}/motion/reaction-gaze.json`, 'utf8'),
      ).presets[preset];
    original.computerLoop = JSON.parse(loopBytes);
    const bytes = await readFile(`${root}/packed-motion/${preset}.bin`);
    const actual = decodeMotionBinary(buffer(bytes));
    identical(original, actual);
    if (original.reactionGaze) {
      attachReactionGaze(original.motion.clips.reaction, original.reactionGaze);
      attachReactionGaze(actual.motion.clips.reaction, actual.reactionGaze);
      const wrongClock = structuredClone(original.motion.clips.reaction);
      wrongClock.times[1] += 0.001;
      assert.throws(() => attachReactionGaze(wrongClock, actual.reactionGaze), /clock/);
    }
    if (original.eyeBlink) {
      attachEyeBlink(original.motion.clips.idle, original.eyeBlink, preset);
      attachEyeBlink(actual.motion.clips.idle, actual.eyeBlink, preset);
      const body = actual.motion.clips.idle.parts.find((p) => p.id === 'mesh:0');
      original.eyeBlink.clips.idle.samples.forEach((v, i) => {
        assert.equal(body.fields.eyeBlink.samples[i * 4], v);
      });
      const wrongClock = structuredClone(original.motion.clips.idle);
      wrongClock.times[1] += 0.001;
      assert.throws(() => attachEyeBlink(wrongClock, actual.eyeBlink, preset), /clock/);
      assert.throws(
        () => attachEyeBlink(actual.motion.clips.idle, actual.eyeBlink, 'alfred'),
        /preset/,
      );
    }
    assert(
      bytes.length < (motionBytes.length + computerBytes.length + loopBytes.length) / 2,
      'At least halve numeric transfer without reducing precision',
    );
    for (const [a, b] of [
      [original.motion.clips.idle, actual.motion.clips.idle],
      [original.motion.clips.reaction, actual.motion.clips.reaction],
      [original.computer.clip, actual.computer.clip],
      [original.computerLoop.clip, actual.computerLoop.clip],
    ]) {
      const source = new AuthoredMotionSampler(a),
        packed = new AuthoredMotionSampler(b);
      const x = source.createPose(),
        y = packed.createPose();
      for (let i = 0; i <= 40; i++) {
        const time = (a.duration * i) / 37;
        source.sample(time, x);
        packed.sample(time, y);
        for (let p = 0; p < x.length; p++) {
          assert(x[p].world.equals(y[p].world), `${preset} world ${p} at ${time}`);
          assert(x[p].normalMatrix.equals(y[p].normalMatrix), `${preset} normal ${p} at ${time}`);
          assert.deepEqual(x[p].fields, y[p].fields);
        }
      }
    }
  });
}
