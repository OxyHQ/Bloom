/** Real OS preference exercise, restricted to the newly-created lab AVD. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireLabEmulator } from './android-gate.mjs';
const require = createRequire(import.meta.url),
  { PNG } = require('pngjs');
const serial = process.env.ANDROID_SERIAL,
  binary = process.env.ADB || 'adb';
assert(/^emulator-/.test(serial), 'Never change motion settings on a physical device');
const adb = (...args) =>
  execFileSync(binary, ['-s', serial, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
requireLabEmulator(
  serial,
  execFileSync(binary, ['devices'], { encoding: 'utf8' }),
  adb('emu', 'avd', 'name'),
  adb('shell', 'getprop', 'ro.kernel.qemu'),
  undefined,
);
const artifact = resolve(process.env.ARTIFACT),
  out = resolve(artifact, 'reduced-motion');
mkdirSync(out, { recursive: true });
const environment = JSON.parse(readFileSync(resolve(artifact, 'environment.json'), 'utf8'));
assert.equal(environment.serial, serial);
assert(environment.build.fixedOpticsTime == null);
const setting = 'transition_animation_scale',
  original = adb('shell', 'settings', 'get', 'global', setting).trim();
writeFileSync(
  resolve(out, 'original-setting.json'),
  JSON.stringify({ serial, setting, value: original }),
);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dump = () => {
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
  assert(m, id);
  return m.slice(1).map(Number);
};
const tap = async (id) => {
  const [x, y, r, b] = bounds(dump(), `benchmark-${id}`);
  adb('shell', 'input', 'tap', String((x + r) >> 1), String((y + b) >> 1));
  await wait(700);
};
const shot = (name) => {
  const b = execFileSync(binary, ['-s', serial, 'exec-out', 'screencap', '-p'], {
    maxBuffer: 16 * 1024 * 1024,
  });
  writeFileSync(resolve(out, `${name}.png`), b);
  return PNG.sync.read(b);
};
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
  assert.equal(changed, 0, `${name} animated under OS reduced motion`);
  return { name, box, changedChannels: changed };
};
const results = [];
try {
  await tap('clock-log');
  const pid = adb('shell', 'pidof', 'so.oxy.bloom.materiallab').trim();
  adb('shell', 'settings', 'put', 'global', setting, '0');
  await wait(700);
  assert.equal(adb('shell', 'settings', 'get', 'global', setting).trim(), '0');
  results.push(await stable('live-os-reduced-motion'));
  adb('shell', 'settings', 'put', 'global', setting, original);
  await wait(1000);
  const logs = adb('logcat', '--pid', pid, '-d', '-s', 'BloomLightClock:I');
  writeFileSync(resolve(out, 'resume-clock.txt'), logs);
  const events = [...logs.matchAll(/resume wallMs=(\d+) deltaSeconds=([-+.\deE]+)/g)].map((m) => ({
    wallMs: Number(m[1]),
    deltaSeconds: Number(m[2]),
  }));
  assert(
    events.some((e) => e.wallMs >= 1500 && e.deltaSeconds >= 0 && e.deltaSeconds < 0.1),
    'No real native resume excluding preference pause',
  );
  results.push({ name: 'os-motion-restored', events });
  adb('shell', 'settings', 'put', 'global', setting, '0');
  adb('shell', 'am', 'force-stop', 'so.oxy.bloom.materiallab');
  adb('shell', 'am', 'start', '-n', 'so.oxy.bloom.materiallab/.MainActivity');
  await wait(4000);
  results.push(await stable('initial-os-reduced-motion'));
  writeFileSync(
    resolve(out, 'report.json'),
    JSON.stringify(
      {
        apkSha256: environment.apkSha256,
        results,
        note: 'Functional API36.1 emulator evidence, not physical GPU performance. No physical settings changed.',
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
} finally {
  if (original === 'null') adb('shell', 'settings', 'delete', 'global', setting);
  else adb('shell', 'settings', 'put', 'global', setting, original);
  assert.equal(
    adb('shell', 'settings', 'get', 'global', setting).trim(),
    original,
    'Restore exact AVD setting',
  );
  adb('shell', 'am', 'force-stop', 'so.oxy.bloom.materiallab');
}
