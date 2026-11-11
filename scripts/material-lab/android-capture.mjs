import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireLabEmulator, requireLabForeground } from './android-gate.mjs';

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
const focusedWindow = () =>
  adb('shell', 'dumpsys', 'window')
    .split(/\r?\n/)
    .find((line) => line.includes('mCurrentFocus=')) ?? '';
const assertForeground = () => {
  const focus = focusedWindow();
  requireLabForeground(focus);
  return focus.trim();
};
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
function bounds(tag, label) {
  assert(tag, `Missing UI target ${label}`);
  const match = tag.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert(match, `Missing bounds ${label}`);
  const [x1, y1, x2, y2] = match.slice(1).map(Number);
  assert(x2 > x1 && y2 > y1, `Invisible UI target ${label}`);
  return { x1, y1, x2, y2 };
}
function node(hierarchy, id) {
  const tag = hierarchy.match(new RegExp(`<node[^>]*resource-id="${id}"[^>]*>`))?.[0];
  return bounds(tag, id);
}
function tapBounds(b) {
  adb(
    'shell',
    'input',
    'tap',
    String(Math.round((b.x1 + b.x2) / 2)),
    String(Math.round((b.y1 + b.y2) / 2)),
  );
}
async function tap(id, hierarchy = xml()) {
  tapBounds(node(hierarchy, id));
  await pause(700);
  assertForeground();
}
const captures = [];
function capture(name, hierarchySnapshot = null) {
  const focus = assertForeground();
  const hierarchy = hierarchySnapshot ?? xml();
  assert(hierarchy.includes('so.oxy.bloom.materiallab'), 'Fixture must own captured window');
  writeFileSync(resolve(out, `${name}${hierarchySnapshot ? '.base' : ''}.xml`), hierarchy);
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
  captures.push({
    name,
    focus,
    geometry,
    hierarchyFresh: hierarchySnapshot === null,
    loaderActive:
      hierarchySnapshot === null ? hierarchy.includes('content-desc="Stop generating"') : null,
  });
  writeFileSync(resolve(out, 'captures.json'), JSON.stringify({ environment, captures }, null, 2));
  return hierarchy;
}
async function scroll(bottom, hierarchy = xml()) {
  const b = node(hierarchy, 'material-scroll');
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
  let actionHierarchy = readFileSync(resolve(out, 'initial.xml'), 'utf8');
  if (theme === 'dark') await tap('material-theme', actionHierarchy);
  for (const background of ['solid', 'stripes', 'photo']) {
    await tap(`material-background-${background}`, actionHierarchy);
    // The app tree has fixed geometry; record fresh pixels while reusing the
    // initial tree for control locations and explicitly label it as a snapshot.
    const sceneHierarchy = capture(`${theme}-${background}`, actionHierarchy);
    // A background selection changes paint only, so its just-captured scroll
    // bounds remain current for this immediate swipe even while the busy SVG
    // prevents UIAutomator from reporting idle.
    await scroll(true, sceneHierarchy);
    // Scrolling continuously changes RN's accessibility tree on this device;
    // use the stable scene hierarchy for geometry while keeping the screenshot
    // as a direct fresh device capture.
    capture(`${theme}-${background}-composer`, sceneHierarchy);
    await scroll(false, sceneHierarchy);
    if (theme === 'light' && background === 'solid') {
      // Keep the first composer screenshot genuinely busy, then pause its
      // animation from a button visible in the current top-of-scroll snapshot.
      await tap('material-loader-toggle', sceneHierarchy);
    }
    // A scroll out and back is not guaranteed to land on the exact same
    // accessibility bounds. Refresh after the motion has settled so overlay
    // taps use current hit-test coordinates rather than the pre-scroll tree.
    actionHierarchy = xml();
    for (const overlay of ['menu', 'dialog', 'sheet']) {
      await tap(`material-${overlay}-trigger`, actionHierarchy);
      capture(`${theme}-${background}-${overlay}`, actionHierarchy);
      adb('shell', 'input', 'keyevent', '4');
      await pause(700);
      capture(`${theme}-${background}-${overlay}-dismissed`, actionHierarchy);
    }
  }
  // The moving photograph keeps Android's accessibility tree continuously
  // active, so capture its pixels from the last stable geometry and return to
  // a static backing before asking UIAutomator for fresh coordinates again.
  await tap('material-background-motion', actionHierarchy);
  capture(`${theme}-motion`, actionHierarchy);
  await tap('material-background-photo', actionHierarchy);
  actionHierarchy = xml();
  await tap('material-transparency', actionHierarchy);
  capture(`${theme}-reduced-transparency`, actionHierarchy);
  await tap('material-transparency', actionHierarchy);
}
console.log(`Captured ${captures.length} native states on ${serial}`);
