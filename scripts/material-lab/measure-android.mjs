import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
const artifact = resolve(process.env.ARTIFACT);
const environment = JSON.parse(readFileSync(resolve(artifact, 'environment.json'), 'utf8'));
assert.equal(environment.serial, serial);
const out = resolve(artifact, process.env.CASE || 'performance');
mkdirSync(out, { recursive: true });
const record = (name, content) => {
  writeFileSync(resolve(out, name), content);
  return content;
};
assert(
  adb('shell', 'dumpsys', 'activity', 'activities')
    .split(/\r?\n/)
    .some(
      (line) =>
        /(?:mResumedActivity|topResumedActivity|ResumedActivity:)/.test(line) &&
        line.includes('so.oxy.bloom.materiallab'),
    ),
  'Only record the foreground synthetic app',
);
const pid = adb('shell', 'pidof', 'so.oxy.bloom.materiallab').trim();
record(
  'initial.png',
  execFileSync(binary, [...target, 'exec-out', 'screencap', '-p'], { maxBuffer: 16 * 1024 * 1024 }),
);
const thermalBefore = record('thermal-before.txt', adb('shell', 'dumpsys', 'thermalservice'));
record('gfx-reset.txt', adb('shell', 'dumpsys', 'gfxinfo', 'so.oxy.bloom.materiallab', 'reset'));
const started = performance.now();
const cpu = record('cpu.txt', adb('shell', 'top', '-b', '-n', '3', '-d', '5', '-p', pid));
const gfx = record(
  'gfx.txt',
  adb('shell', 'dumpsys', 'gfxinfo', 'so.oxy.bloom.materiallab', 'framestats'),
);
const elapsedMs = performance.now() - started;
const memory = record('memory.txt', adb('shell', 'dumpsys', 'meminfo', 'so.oxy.bloom.materiallab'));
const thermalAfter = record('thermal-after.txt', adb('shell', 'dumpsys', 'thermalservice'));
const number = (text, pattern) => Number(text.match(pattern)?.[1] ?? NaN);
const rows = gfx.split(/\r?\n/);
const header = rows.findIndex((line) => line.startsWith('Flags,FrameTimeline'));
const columns = rows[header]?.split(',') || [];
const durations = [],
  intervals = [];
for (const row of rows.slice(header + 1)) {
  if (!/^\d+,/.test(row)) continue;
  const cells = row.split(',').map(Number);
  if (cells[0] !== 0) continue;
  const duration =
    (cells[columns.indexOf('FrameCompleted')] - cells[columns.indexOf('IntendedVsync')]) / 1e6;
  if (Number.isFinite(duration) && duration > 0 && duration < 10000) durations.push(duration);
  intervals.push(cells[columns.indexOf('FrameInterval')] / 1e6);
}
const percentile = (values, p) =>
  [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)] ?? null;
const report = {
  apkSha256: environment.apkSha256,
  build: environment.build,
  serial,
  case: process.env.CASE || 'performance',
  elapsedMs,
  frames: number(gfx, /Total frames rendered: (\d+)/),
  jankyFrames: number(gfx, /Janky frames: (\d+)/),
  histogramP50Ms: number(gfx, /50th percentile: (\d+)ms/),
  histogramP95Ms: number(gfx, /95th percentile: (\d+)ms/),
  gpuP50Ms: number(gfx, /50th gpu percentile: (\d+)ms/),
  gpuP95Ms: number(gfx, /95th gpu percentile: (\d+)ms/),
  recentFrameSamples: durations.length,
  recentFrameP50Ms: percentile(durations, 0.5),
  recentFrameP95Ms: percentile(durations, 0.95),
  recentFrameIntervalMs: percentile(intervals, 0.5),
  cpuPercentOfOneCore: cpu
    .split(/\r?\n/)
    .filter((line) => /^\s*\d+\s/.test(line) && line.includes('so.oxy.bloom.materiallab'))
    .map((line) => Number(line.trim().split(/\s+/)[8])),
  pssKb: number(memory, /TOTAL PSS:\s*(\d+)/),
  rssKb: number(memory, /TOTAL RSS:\s*(\d+)/),
  thermalStatusBefore: number(thermalBefore, /Thermal Status: (\d+)/),
  thermalStatusAfter: number(thermalAfter, /Thermal Status: (\d+)/),
  note: 'Single controlled foreground window, no screen recording; frame timestamps are not an FPS guarantee. Preserve font/display settings and compare thermal state.',
};
record('report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
