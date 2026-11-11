import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireLabEmulator, requireLabForeground } from './android-gate.mjs';

const out = resolve(process.env.OUT || '../../.local/material-android');
const environment = JSON.parse(readFileSync(resolve(out, 'environment.json'), 'utf8'));
const serial = process.env.ANDROID_SERIAL;
assert.equal(serial, environment.serial, 'Select the device from the successful APK gate');
assert.equal(serial, process.env.AUTHORIZED_PHYSICAL_SERIAL, 'Authorize the exact physical device');
const binary = process.env.ADB || 'adb';
const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [];
const target = [...server, '-s', serial];
const adb = (...args) =>
  execFileSync(binary, [...target, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
requireLabEmulator(
  serial,
  execFileSync(binary, [...server, 'devices'], { encoding: 'utf8' }),
  '',
  adb('shell', 'getprop', 'ro.kernel.qemu'),
  process.env.AUTHORIZED_PHYSICAL_SERIAL,
);
const focusedWindow = () =>
  adb('shell', 'dumpsys', 'window')
    .split(/\r?\n/)
    .find((line) => line.includes('mCurrentFocus=')) ?? '';
const assertForeground = () => requireLabForeground(focusedWindow());
const hierarchy = () => {
  adb('shell', 'rm', '-f', '/sdcard/bloom-material-chip-target.xml');
  const output = adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-material-chip-target.xml');
  assert(output.includes('dumped to'), 'UIAutomator could not observe an idle layout');
  assertForeground();
  return adb('shell', 'cat', '/sdcard/bloom-material-chip-target.xml');
};
function bounds(xml, resourceId) {
  const tag = xml.match(new RegExp(`<node[^>]*resource-id="[^"]*${resourceId}"[^>]*>`))?.[0];
  assert(tag, `Missing UI node ${resourceId}`);
  const match = tag.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert(match, `Missing bounds for ${resourceId}`);
  const [left, top, right, bottom] = match.slice(1).map(Number);
  assert(right > left && bottom > top, `Invisible UI node ${resourceId}`);
  return { left, top, right, bottom };
}
function tapCount(xml) {
  const match = xml.match(/text="Taps: (\d+)"/);
  assert(match, 'Missing live chip tap count');
  return Number(match[1]);
}

let current = hierarchy();
assert.equal(tapCount(current), 0, 'Begin with an untouched filter');
const chip = bounds(current, 'material-chip-target');
const density = Number(environment.density.match(/\d+/)?.[0]);
assert(Number.isFinite(density) && density > 0, 'Physical display density is required');
const heightDp = ((chip.bottom - chip.top) * 160) / density;
assert(Math.abs(heightDp - 44) <= 0.5, `Chip bounds must be 44dp tall, received ${heightDp}`);
const offset = Math.ceil((1.5 * density) / 160);
const outsidePoints = [
  { x: Math.round((chip.left + chip.right) / 2), y: chip.top - offset, edge: 'top' },
  { x: Math.round((chip.left + chip.right) / 2), y: chip.bottom + offset, edge: 'bottom' },
];
const taps = [];
for (const point of outsidePoints) {
  adb('shell', 'input', 'tap', String(point.x), String(point.y));
  await new Promise((done) => setTimeout(done, 500));
  current = hierarchy();
  const count = tapCount(current);
  assert.equal(
    count,
    taps.length + 1,
    `Tap just outside the visible ${point.edge} edge did not activate Chip`,
  );
  taps.push({ ...point, count });
}
const report = {
  serial,
  app: 'so.oxy.bloom.materiallab',
  source: environment.build,
  displayDensity: density,
  chipVisibleBoundsPx: chip,
  chipVisualHeightDp: heightDp,
  outsideTapOffsetDp: (offset * 160) / density,
  taps,
  finalCount: tapCount(current),
};
writeFileSync(resolve(out, 'chip-target-probe.json'), JSON.stringify(report, null, 2));
writeFileSync(
  resolve(out, 'chip-target-probe.png'),
  execFileSync(binary, [...target, 'exec-out', 'screencap', '-p']),
);
writeFileSync(resolve(out, 'chip-target-probe.xml'), current);
console.log(JSON.stringify(report, null, 2));
