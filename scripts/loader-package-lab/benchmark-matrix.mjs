/** Replay the same physical release fixture cases without recording video. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireLabEmulator } from '../material-lab/android-gate.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const serial = process.env.ANDROID_SERIAL;
const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [];
const binary = process.env.ADB || 'adb';
const adb = (...args) =>
  execFileSync(binary, [...server, '-s', serial, ...args], { encoding: 'utf8' });
requireLabEmulator(
  serial,
  execFileSync(binary, [...server, 'devices'], { encoding: 'utf8' }),
  /^emulator-/.test(serial) ? adb('emu', 'avd', 'name') : '',
  adb('shell', 'getprop', 'ro.kernel.qemu'),
  process.env.AUTHORIZED_PHYSICAL_SERIAL,
);
const artifact = resolve(process.env.ARTIFACT);
assert.equal(
  JSON.parse(readFileSync(resolve(artifact, 'environment.json'), 'utf8')).serial,
  serial,
);
const hierarchy = () => {
  assert(
    adb('shell', 'dumpsys', 'activity', 'activities')
      .split(/\r?\n/)
      .some(
        (line) =>
          /(?:mResumedActivity|topResumedActivity|ResumedActivity:)/.test(line) &&
          line.includes('so.oxy.bloom.loaderpackagelab'),
      ),
    'Synthetic app must be foreground',
  );
  adb('shell', 'rm', '-f', '/sdcard/bloom-loader-package-663.xml');
  assert(
    adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-loader-package-663.xml').includes(
      'dumped to',
    ),
    'Never reuse stale XML',
  );
  return adb('shell', 'cat', '/sdcard/bloom-loader-package-663.xml');
};
const controls = hierarchy();
const click = (id) => {
  const match = controls.match(
    new RegExp(`resource-id="benchmark-${id}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`),
  );
  assert(match, `Missing real native control ${id}`);
  const [x, y, right, bottom] = match.slice(1).map(Number);
  adb(
    'shell',
    'input',
    'tap',
    String(Math.floor((x + right) / 2)),
    String(Math.floor((y + bottom) / 2)),
  );
};
// Start from the newly launched default fixture: active, full width, pill radius, normal clock.
assert(
  controls.includes('count=1 taper=0 active=true speed=4.5'),
  'Launch a fresh default benchmark before the matrix',
);
for (const [name, count, taper] of [
  ['one-taper0', 1, 0],
  ['two-taper0', 2, 0],
  ['one-taper05', 1, 0.5],
  ['two-taper05', 2, 0.5],
  ['two-taper05-repeat2', 2, 0.5],
  ['two-taper05-repeat3', 2, 0.5],
]) {
  click(count === 1 ? 'one' : 'two');
  click(taper === 0 ? 'taper-off' : 'taper-on');
  await new Promise((resolve) => setTimeout(resolve, 2000));
  assert(
    hierarchy().includes(`count=${count} taper=${taper} active=true speed=4.5`),
    `Wrong scene ${name}`,
  );
  const report = JSON.parse(
    execFileSync(process.execPath, [resolve(here, 'measure-android.mjs')], {
      env: { ...process.env, ARTIFACT: artifact, CASE: name },
      encoding: 'utf8',
    }),
  );
  console.log(
    JSON.stringify(
      Object.fromEntries(
        [
          'case',
          'frames',
          'jankyFrames',
          'gpuP95Ms',
          'recentFrameP95Ms',
          'cpuPercentOfOneCore',
          'thermalStatusBefore',
          'thermalStatusAfter',
        ].map((key) => [key, report[key]]),
      ),
    ),
  );
}
