import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireLabEmulator } from './android-gate.mjs';

// Run only after android-gate: preserve the inspected APK/device identity.
const out = resolve(process.env.OUT || '../../.local/material-android');
const environment = JSON.parse(readFileSync(resolve(out, 'environment.json'), 'utf8'));
const serial = process.env.ANDROID_SERIAL;
assert.equal(serial, environment.serial, 'Select the device from the successful APK gate');
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
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const xml = () => {
  assert(adb('shell', 'pidof', 'so.oxy.bloom.materiallab').trim());
  adb('shell', 'rm', '-f', '/sdcard/bloom-material-663.xml');
  const dumped = adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-material-663.xml');
  assert(
    dumped.includes('dumped to'),
    'UIAutomator could not observe idle state; refusing stale coordinates',
  );
  return adb('shell', 'cat', '/sdcard/bloom-material-663.xml');
};
function node(hierarchy, id) {
  const tag = hierarchy.match(new RegExp(`<node[^>]*resource-id="${id}"[^>]*>`))?.[0];
  assert(tag, `Missing UI target ${id}`);
  const bounds = tag.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert(bounds, `Missing bounds ${id}`);
  const [x1, y1, x2, y2] = bounds.slice(1).map(Number);
  assert(x2 > x1 && y2 > y1, `Invisible UI target ${id}`);
  return { x1, y1, x2, y2 };
}
async function tap(id) {
  const b = node(xml(), id);
  adb(
    'shell',
    'input',
    'tap',
    String(Math.round((b.x1 + b.x2) / 2)),
    String(Math.round((b.y1 + b.y2) / 2)),
  );
  await pause(700);
}
const captures = [];
function capture(name) {
  const hierarchy = xml();
  assert(hierarchy.includes('so.oxy.bloom.materiallab'), 'Fixture must own captured window');
  writeFileSync(resolve(out, `${name}.xml`), hierarchy);
  writeFileSync(
    resolve(out, `${name}.png`),
    execFileSync(binary, [...target, 'exec-out', 'screencap', '-p'], {
      maxBuffer: 16 * 1024 * 1024,
    }),
  );
  const geometry = {};
  for (const role of ['surface', 'card', 'island', 'loader', 'composer']) {
    try {
      geometry[role] = node(hierarchy, `material-${role}`);
    } catch {}
  }
  captures.push({ name, geometry });
  writeFileSync(resolve(out, 'captures.json'), JSON.stringify({ environment, captures }, null, 2));
}
async function scroll(bottom) {
  const b = node(xml(), 'material-scroll');
  const x = String(Math.round((b.x1 + b.x2) / 2));
  const upper = Math.round(b.y1 + (b.y2 - b.y1) * 0.2);
  const lower = Math.round(b.y1 + (b.y2 - b.y1) * 0.8);
  adb(
    'shell',
    'input',
    'swipe',
    x,
    String(bottom ? lower : upper),
    x,
    String(bottom ? upper : lower),
    '400',
  );
  await pause(600);
}
for (const theme of ['light', 'dark']) {
  if (theme === 'dark') await tap('material-theme');
  for (const background of ['solid', 'stripes', 'photo', 'motion']) {
    await tap(`material-background-${background}`);
    capture(`${theme}-${background}`);
    await scroll(true);
    capture(`${theme}-${background}-composer`);
    await scroll(false);
    for (const overlay of ['menu', 'dialog', 'sheet']) {
      await tap(`material-${overlay}-trigger`);
      capture(`${theme}-${background}-${overlay}`);
      if (overlay === 'menu') adb('shell', 'input', 'keyevent', '4');
      else await tap(`material-${overlay}-close`);
      await pause(700);
      assert(xml().includes('material-background-solid'), 'Overlay did not return to the fixture');
    }
  }
  await tap('material-transparency');
  capture(`${theme}-reduced-transparency`);
  await tap('material-transparency');
}
console.log(`Captured ${captures.length} native states on ${serial}`);
