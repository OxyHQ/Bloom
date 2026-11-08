import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireLabEmulator } from './android-gate.mjs';
const serial = process.env.ANDROID_SERIAL;
const binary = process.env.ADB || 'adb';
const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [];
const target = [...server, '-s', serial];
const adb = (...args) =>
  execFileSync(binary, [...target, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
requireLabEmulator(
  serial,
  execFileSync(binary, [...server, 'devices'], { encoding: 'utf8' }),
  /^emulator-/.test(serial) ? adb('emu', 'avd', 'name') : '',
  adb('shell', 'getprop', 'ro.kernel.qemu'),
  process.env.AUTHORIZED_PHYSICAL_SERIAL,
);
const out = resolve(process.env.ARTIFACT);
const environment = JSON.parse(readFileSync(resolve(out, 'environment.json'), 'utf8'));
assert.equal(environment.serial, serial);
assert.equal(environment.build.fixedOpticsTime, 1, 'Use an attested fixed-phase optics artifact');
const dump = () => {
  assert(
    adb('shell', 'dumpsys', 'activity', 'activities')
      .split(/\r?\n/)
      .some(
        (line) =>
          /(?:mResumedActivity|topResumedActivity|ResumedActivity:)/.test(line) &&
          line.includes('so.oxy.bloom.materiallab'),
      ),
    'Only capture the synthetic app',
  );
  adb('shell', 'rm', '-f', '/sdcard/bloom-material-663.xml');
  assert(
    adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-material-663.xml').includes('dumped to'),
  );
  return adb('shell', 'cat', '/sdcard/bloom-material-663.xml');
};
assert(
  dump().includes('count=1 taper=0 active=true speed=4.5'),
  'Start from a fresh default scene',
);
const tap = (xml, control) => {
  const match = xml.match(
    new RegExp(
      `resource-id="benchmark-${control}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`,
    ),
  );
  assert(match, `Missing real control ${control}`);
  const [x, y, right, bottom] = match.slice(1).map(Number);
  adb(
    'shell',
    'input',
    'tap',
    String(Math.floor((x + right) / 2)),
    String(Math.floor((y + bottom) / 2)),
  );
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 700));
const capture = (name, xml) => {
  writeFileSync(resolve(out, `${name}.xml`), xml);
  writeFileSync(
    resolve(out, `${name}.png`),
    execFileSync(binary, [...target, 'exec-out', 'screencap', '-p'], {
      maxBuffer: 16 * 1024 * 1024,
    }),
  );
};
let xml = dump();
if (process.env.LAYERS === '1') {
  tap(xml, 'taper-on');
  await settle();
  xml = dump();
  const cases = [];
  for (const [variant, theme, control] of [
    ['taper', 'light', null],
    ['narrow-taper', 'light', 'width'],
    ['corner-taper', 'light', 'radius'],
    ['corner-taper', 'dark', 'theme'],
    ['narrow-taper', 'dark', 'radius'],
    ['taper', 'dark', 'width'],
  ]) {
    if (control) {
      tap(xml, control);
      await settle();
      xml = dump();
    }
    const bounds = xml.match(
      /resource-id="benchmark-loader-one"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/,
    );
    assert(bounds, 'Missing measured frame');
    cases.push({ variant, theme, bounds: bounds.slice(1).map(Number) });
    for (const layer of process.env.SCENES_ONLY === '1'
      ? ['all']
      : ['all', 'bloom', 'glow', 'line', 'none']) {
      assert(xml.includes(`layer=${layer}`), `Expected ${layer} diagnostic layer`);
      capture(`${theme}-${variant}-${layer}`, xml);
      if (process.env.SCENES_ONLY !== '1') {
        tap(xml, 'layer');
        await settle();
        xml = dump();
      }
    }
    console.log(`Captured ${theme} ${variant}, all four light states and surface reference`);
  }
  writeFileSync(
    resolve(out, 'layers.json'),
    JSON.stringify({ cases, fixedTime: 1, density: 2.625 }, null, 2),
  );
} else {
  for (const [control, name] of [
    ['taper-on', 'taper05'],
    ['width', 'narrow-taper05'],
    ['radius', 'narrow-radius12-taper05'],
    ['theme', 'dark-narrow-radius12-taper05'],
  ]) {
    tap(xml, control);
    await settle();
    xml = dump();
    capture(name, xml);
  }
}
console.log(`Full-viewport fixed-phase states saved in ${out}`);
