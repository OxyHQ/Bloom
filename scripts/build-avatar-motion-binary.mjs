/** Lossless packaging only: no simplification, resampling, or float32 rounding. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export function encodeMotionBinary(document) {
  const chunks = [],
    channels = new Map();
  let values = 0;
  function visit(value) {
    if (Array.isArray(value)) {
      if (!value.length || !value.every((n) => typeof n === 'number')) return value.map(visit);
      assert(value.every(Number.isFinite), 'Motion values must be finite');
      const bytes = Buffer.alloc(value.length * 8);
      value.forEach((n, i) => bytes.writeDoubleLE(n, i * 8));
      const key = createHash('sha256').update(bytes).digest('hex');
      let channel = channels.get(key);
      if (!channel) {
        channel = { range: [values, value.length], bytes };
        channels.set(key, channel);
        chunks.push(bytes);
        values += value.length;
      } else assert(channel.bytes.equals(bytes), 'Channel hash collision');
      return { $motionF64: channel.range };
    }
    if (value && typeof value === 'object') {
      assert(!('$motionF64' in value), 'Reserved binary channel marker');
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]));
    }
    return value;
  }
  const metadata = Buffer.from(JSON.stringify(visit(document)));
  const offset = Math.ceil((16 + metadata.length) / 8) * 8;
  const header = Buffer.alloc(offset);
  header.writeUInt32LE(0x464d4142, 0);
  header.writeUInt32LE(0x01003436, 4);
  header.writeUInt32LE(metadata.length, 8);
  header.writeUInt32LE(values, 12);
  metadata.copy(header, 16);
  return Buffer.concat([header, ...chunks]);
}

export async function buildMotionBinaries() {
  const root = 'runtime/avatar/assets';
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
  await mkdir(`${root}/packed-motion`, { recursive: true });
  const report = [];
  const reactionGaze = JSON.parse(await readFile(`${root}/motion/reaction-gaze.json`, 'utf8'));
  for (const preset of presets) {
    const motion = await readFile(`${root}/motion/${preset}.json`);
    const computer = await readFile(`${root}/${preset}/computer-motion.json`);
    const bundle = {
      schema: 'bloom.avatar.motion-bundle',
      version: 1,
      preset,
      motion: JSON.parse(motion),
      computer: JSON.parse(computer),
    };
    let blinkBytes;
    if (preset === 'lime_headphones') {
      blinkBytes = await readFile(`${root}/motion/lime-headphones-eye-blink.json`);
      const blink = JSON.parse(blinkBytes);
      assert.equal(blink.preset, preset);
      assert.deepEqual(blink.clips.idle.times, bundle.motion.clips.idle.times);
      assert.equal(blink.clips.idle.duration, bundle.motion.clips.idle.duration);
      assert.equal(blink.clips.idle.samples.length, bundle.motion.clips.idle.times.length);
      bundle.eyeBlink = blink;
    }
    const reaction = reactionGaze.presets[preset];
    if (reaction) {
      assert.deepEqual(reaction.times, bundle.motion.clips.reaction.times);
      bundle.reactionGaze = reaction;
    }
    const reactionBytes = reaction ? Buffer.from(JSON.stringify(reaction)) : null;
    const loopBytes = await readFile(`${root}/${preset}/computer-loop.json`);
    bundle.computerLoop = JSON.parse(loopBytes);
    assert.equal(bundle.computerLoop.preset, preset);
    const binary = encodeMotionBinary(bundle);
    await writeFile(`${root}/packed-motion/${preset}.bin`, binary);
    report.push({
      preset,
      originalBytes:
        motion.length +
        computer.length +
        loopBytes.length +
        (blinkBytes?.length ?? 0) +
        (reactionBytes?.length ?? 0),
      binaryBytes: binary.length,
      originalGzipBytes:
        gzipSync(motion).length +
        gzipSync(computer).length +
        gzipSync(loopBytes).length +
        (blinkBytes ? gzipSync(blinkBytes).length : 0) +
        (reactionBytes ? gzipSync(reactionBytes).length : 0),
      binaryGzipBytes: gzipSync(binary).length,
      sha256: createHash('sha256').update(binary).digest('hex'),
    });
  }
  await writeFile('.local/avatar-motion-binary-build.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await buildMotionBinaries();
