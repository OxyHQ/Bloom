import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireLabEmulator } from './android-gate.mjs';
import { requireMotionArtifact } from './benchmark-contract.mjs';
const require = createRequire(import.meta.url),
  { PNG } = require('pngjs');
const here = dirname(fileURLToPath(import.meta.url));
const artifact = resolve(process.env.ARTIFACT),
  out = resolve(artifact, 'lifecycle');
mkdirSync(out, { recursive: true });
const environment = JSON.parse(readFileSync(resolve(artifact, 'environment.json'), 'utf8'));
requireMotionArtifact(environment.build);
const serial = process.env.ANDROID_SERIAL,
  binary = process.env.ADB || 'adb';
const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [],
  target = [...server, '-s', serial];
const adb = (...args) =>
  execFileSync(binary, [...target, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
requireLabEmulator(
  serial,
  execFileSync(binary, [...server, 'devices'], { encoding: 'utf8' }),
  /^emulator-/.test(serial) ? adb('emu', 'avd', 'name') : '',
  adb('shell', 'getprop', 'ro.kernel.qemu'),
  process.env.AUTHORIZED_PHYSICAL_SERIAL,
);
assert.equal(environment.serial, serial);
const pid = adb('shell', 'pidof', 'so.oxy.bloom.materiallab').trim();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dump = () => {
  assert(
    adb('shell', 'dumpsys', 'activity', 'activities')
      .split(/\r?\n/)
      .some(
        (line) =>
          /(?:mResumedActivity|topResumedActivity|ResumedActivity:)/.test(line) &&
          line.includes('so.oxy.bloom.materiallab'),
      ),
    'Only inspect the foreground synthetic app',
  );
  adb('shell', 'rm', '-f', '/sdcard/bloom-material-663.xml');
  assert(
    adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-material-663.xml').includes('dumped to'),
  );
  return adb('shell', 'cat', '/sdcard/bloom-material-663.xml');
};
const bounds = (xml, id) => {
  const m = xml.match(
    new RegExp(`resource-id="${id}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`),
  );
  assert(m, `Missing ${id}`);
  return m.slice(1).map(Number);
};
const tap = async (id) => {
  const [x, y, r, b] = bounds(dump(), `benchmark-${id}`);
  adb('shell', 'input', 'tap', String(Math.floor((x + r) / 2)), String(Math.floor((y + b) / 2)));
  await wait(700);
};
const shot = (name) => {
  const bytes = execFileSync(binary, [...target, 'exec-out', 'screencap', '-p'], {
    maxBuffer: 16 * 1024 * 1024,
  });
  writeFileSync(resolve(out, `${name}.png`), bytes);
  return PNG.sync.read(bytes);
};
const clock = () => {
  const raw = adb('logcat', '--pid', pid, '-d', '-s', 'BloomLightClock:I');
  return {
    raw,
    events: [
      ...raw.matchAll(/resume wallMs=(\d+) deltaSeconds=([-+.\deE]+) seconds=([-+.\deE]+)/g),
    ].map((m) => ({ wallMs: Number(m[1]), deltaSeconds: Number(m[2]), seconds: Number(m[3]) })),
  };
};
const results = [];
const stable = async (name) => {
  const xml = dump(),
    box = bounds(xml, 'benchmark-loader-one');
  writeFileSync(resolve(out, `${name}.xml`), xml);
  const a = shot(`${name}-start`);
  await wait(2000);
  const b = shot(`${name}-end`);
  let changed = 0;
  for (let y = box[1]; y < box[3]; y++)
    for (let x = box[0]; x < box[2]; x++)
      for (let c = 0; c < 3; c++)
        if (a.data[(y * a.width + x) * 4 + c] !== b.data[(y * b.width + x) * 4 + c]) changed++;
  assert.equal(changed, 0, `${name} must keep the visible light static`);
  results.push({ name, box, changedChannels: changed });
};
const resumed = (name, previous) => {
  const result = clock();
  writeFileSync(resolve(out, `${name}-clock.txt`), result.raw);
  const events = result.events.slice(previous).filter((event) => event.wallMs >= 1200);
  assert(
    events.some((event) => event.deltaSeconds >= 0 && event.deltaSeconds < 0.1),
    `${name}: no measured wall-gap-free resume`,
  );
  results.push({ name, events });
};
await tap('one');
await tap('taper-on');
await tap('clock-log');
let previous = clock().events.length;
await tap('pause');
await stable('explicit-pause');
await tap('pause');
resumed('explicit-resume', previous);
await tap('screen-mode');
previous = clock().events.length;
await tap('screen-mode');
await stable('screen-inactive');
await tap('screen-mode');
resumed('screen-resume', previous);
previous = clock().events.length;
adb('shell', 'input', 'keyevent', '3');
await wait(2200); // No screenshot or interaction with launcher.
adb('shell', 'am', 'start', '-n', 'so.oxy.bloom.materiallab/.MainActivity');
await wait(1000);
resumed('background-resume', previous);
shot('background-resumed');
const video = (name) => {
  const remote = `/sdcard/bloom-material-663-${name}.mp4`;
  adb('shell', 'screenrecord', '--time-limit', '12', remote);
  writeFileSync(
    resolve(out, `${name}.mp4`),
    execFileSync(binary, [...target, 'exec-out', 'cat', remote], { maxBuffer: 64 * 1024 * 1024 }),
  );
  adb('shell', 'rm', remote);
};
video('forward-full-pill');
await tap('width');
await tap('radius');
await tap('theme');
await tap('reverse');
const resized = dump();
writeFileSync(resolve(out, 'resized.xml'), resized);
shot('dark-narrow-radius12');
results.push({ name: 'resize', box: bounds(resized, 'benchmark-loader-one') });
video('reverse-dark-narrow-radius12');
await tap('motion');
await wait(200);
await tap('two');
await stable('initial-inactive');
const inactive = JSON.parse(
  execFileSync(process.execPath, [resolve(here, 'measure-android.mjs')], {
    env: { ...process.env, ARTIFACT: artifact, CASE: 'initial-inactive' },
    encoding: 'utf8',
  }),
);
assert(inactive.frames <= 2, `Inactive mounted loaders keep drawing: ${inactive.frames}`);
results.push({
  name: 'initial-inactive-performance',
  frames: inactive.frames,
  cpuPercentOfOneCore: inactive.cpuPercentOfOneCore,
});
await tap('motion');
const [x, y, r, b] = bounds(dump(), 'benchmark-motion'),
  cx = Math.floor((x + r) / 2),
  cy = Math.floor((y + b) / 2);
adb('shell', `input tap ${cx} ${cy}\nsleep 0.1\ninput tap ${cx} ${cy}`);
await wait(800);
const final = dump();
assert(final.includes('active=true'), 'Rapid disable/enable must end active');
writeFileSync(resolve(out, 'rapid-toggle.xml'), final);
const rapid = shot('rapid-toggle'),
  inactivePixels = PNG.sync.read(readFileSync(resolve(out, 'initial-inactive-end.png')));
for (const id of ['benchmark-loader-one', 'benchmark-loader-two']) {
  const box = bounds(final, id);
  let changed = 0;
  for (let yy = box[1]; yy < box[3]; yy++)
    for (let xx = box[0]; xx < box[2]; xx++)
      for (let c = 0; c < 3; c++)
        if (
          rapid.data[(yy * rapid.width + xx) * 4 + c] !==
          inactivePixels.data[(yy * inactivePixels.width + xx) * 4 + c]
        )
          changed++;
  assert(changed > 100, `${id} did not visibly recover after rapid toggle`);
  results.push({ name: 'rapid-toggle-visible', id, changedChannels: changed });
}
writeFileSync(
  resolve(out, 'state-and-clock.log'),
  adb('logcat', '--pid', pid, '-d', '-s', 'BloomLightClock:I', 'ReactNativeJS:I'),
);
writeFileSync(
  resolve(out, 'active-threads.txt'),
  adb('shell', 'top', '-H', '-b', '-n', '2', '-d', '1', '-p', pid),
);
writeFileSync(
  resolve(out, 'report.json'),
  JSON.stringify(
    {
      apkSha256: environment.apkSha256,
      results,
      note: 'Real Pixel/native clock and pixels; videos are excluded from performance windows. Physical OS settings unchanged.',
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results));
adb('shell', 'am', 'force-stop', 'so.oxy.bloom.materiallab');
