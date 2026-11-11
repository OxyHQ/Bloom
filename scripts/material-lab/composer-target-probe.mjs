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
  execFileSync(binary, [...target, ...args], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    timeout: 30_000,
  });
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
  adb('shell', 'rm', '-f', '/sdcard/bloom-composer-target.xml');
  const output = adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-composer-target.xml');
  assert(output.includes('dumped to'), 'UIAutomator could not observe an idle layout');
  assertForeground();
  return adb('shell', 'cat', '/sdcard/bloom-composer-target.xml');
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
function targetCount(xml) {
  const tag = xml.match(/<node[^>]*resource-id="[^"]*material-composer-target-count"[^>]*>/)?.[0];
  assert(tag, 'Missing ComposerIconButton tap count');
  const match = tag.match(/text="Taps: (\d+)"/);
  assert(match, 'Missing live ComposerIconButton tap count');
  return Number(match[1]);
}
function tap(point) {
  adb('shell', 'input', 'tap', String(point.x), String(point.y));
}
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const density = Number(environment.density.match(/\d+/)?.[0]);
assert(Number.isFinite(density) && density > 0, 'Physical display density is required');
const pxPerDp = density / 160;
let current = hierarchy();
assert.equal(targetCount(current), 0, 'Begin with untouched composer controls');
const cases = [];
for (const size of [28, 32, 36]) {
  const id = `material-composer-target-${size}`;
  const box = bounds(current, id);
  const widthDp = ((box.right - box.left) * 160) / density;
  const heightDp = ((box.bottom - box.top) * 160) / density;
  assert(Math.abs(widthDp - size) <= 0.5, `${size}px box width measured ${widthDp}dp`);
  assert(Math.abs(heightDp - size) <= 0.5, `${size}px box height measured ${heightDp}dp`);

  const slopDp = (48 - size) / 2;
  const insideOffset = Math.max(1, slopDp - 1);
  const outsideOffset = slopDp + 1;
  for (const edge of ['top', 'left']) {
    const point = (offsetDp) =>
      edge === 'top'
        ? {
            x: Math.round((box.left + box.right) / 2),
            y: box.top - Math.ceil(offsetDp * pxPerDp),
          }
        : {
            x: box.left - Math.ceil(offsetDp * pxPerDp),
            y: Math.round((box.top + box.bottom) / 2),
          };
    const beforeInside = targetCount(current);
    const inside = point(insideOffset);
    tap(inside);
    await pause(450);
    current = hierarchy();
    assert.equal(
      targetCount(current),
      beforeInside + 1,
      `${size}px control missed a ${insideOffset}dp outside ${edge} edge tap`,
    );
    cases.push({ size, edge, region: 'inside', offsetDp: insideOffset, point: inside });

    const beforeOutside = targetCount(current);
    const outside = point(outsideOffset);
    tap(outside);
    await pause(450);
    current = hierarchy();
    assert.equal(
      targetCount(current),
      beforeOutside,
      `${size}px control accepted a tap ${outsideOffset}dp outside its ${edge} target`,
    );
    cases.push({ size, edge, region: 'outside', offsetDp: outsideOffset, point: outside });
  }
}
const report = {
  serial,
  model: adb('shell', 'getprop', 'ro.product.model').trim(),
  os: environment.os,
  api: environment.api,
  source: environment.build,
  displayDensity: density,
  composerControls: [28, 32, 36].map((size) => {
    const box = bounds(current, `material-composer-target-${size}`);
    return {
      sizeDp: size,
      boundsPx: box,
      widthDp: ((box.right - box.left) * 160) / density,
      heightDp: ((box.bottom - box.top) * 160) / density,
      expectedTargetDp: 48,
    };
  }),
  cases,
  finalCount: targetCount(current),
};
writeFileSync(resolve(out, 'composer-target-probe.json'), JSON.stringify(report, null, 2));
writeFileSync(resolve(out, 'composer-target-probe.xml'), current);
const remoteScreenshot = '/sdcard/bloom-composer-target-probe.png';
adb('shell', 'screencap', '-p', remoteScreenshot);
execFileSync(
  binary,
  [...target, 'pull', remoteScreenshot, resolve(out, 'composer-target-probe.png')],
  {
    encoding: 'utf8',
    timeout: 30_000,
  },
);
adb('shell', 'rm', '-f', remoteScreenshot);
console.log(JSON.stringify(report, null, 2));
