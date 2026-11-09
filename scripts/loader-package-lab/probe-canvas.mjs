import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const serial = process.env.ANDROID_SERIAL;
assert(
  serial && serial === process.env.AUTHORIZED_PHYSICAL_SERIAL,
  'Explicit authorized physical serial required',
);
const command = process.env.ADB;
assert(command, 'ADB executable required');
const prefix = [...(process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : []), '-s', serial];
const binary = (...args) =>
  execFileSync(command, [...prefix, ...args], { maxBuffer: 32 * 1024 * 1024 });
const adb = (...args) =>
  binary(...args)
    .toString('utf8')
    .trim();
const pkg = 'so.oxy.bloom.loaderpackagelab';
const mode = process.env.CASE || 'snapshot';
assert(['snapshot', 'transient', 'software-host'].includes(mode));
const out = resolve(process.env.OUT || `../../.local/loader-adapter/${mode}`);
mkdirSync(out, { recursive: true });
assert.equal(adb('get-state'), 'device');
assert(
  adb('shell', 'dumpsys', 'activity', 'activities')
    .split(/\r?\n/)
    .some(
      (line) =>
        /(?:mResumedActivity|topResumedActivity|ResumedActivity:)/.test(line) && line.includes(pkg),
    ),
  'Only probe the foreground synthetic activity',
);
const pid = adb('shell', 'pidof', pkg);
assert(/^\d+$/.test(pid));
const beforeLog = adb('logcat', '-d', `--pid=${pid}`);
assert(beforeLog.includes('BloomBenchmarkState:'), 'Scene has not passed offline probes');
writeFileSync(resolve(out, 'before.png'), binary('exec-out', 'screencap', '-p'));
const startMarker = beforeLog.split(/\r?\n/).length;
adb(
  'shell',
  'am',
  'start',
  '-n',
  `${pkg}/.MainActivity`,
  '--es',
  'bloomProbe',
  mode === 'software-host' ? 'snapshot' : mode,
);
await new Promise((resolve) => setTimeout(resolve, 3000));
const log = adb('logcat', '-d', `--pid=${pid}`);
writeFileSync(resolve(out, 'logcat.txt'), log);
const probe = log
  .split(/\r?\n/)
  .slice(startMarker - 1)
  .filter((line) => line.includes('BloomCanvasProbe'));
const before = Number(
  probe.find((line) => line.includes('before count='))?.match(/count=(\d+)/)?.[1],
);
const after = Number(
  probe.find((line) => line.includes('after count='))?.match(/count=(\d+)/)?.[1],
);
const captures = [];
for (const line of probe) {
  const path = line.match(
    /path=(\/storage\/emulated\/0\/Android\/data\/so\.oxy\.bloom\.loaderpackagelab\/files\/snapshot-\d+\.png)/,
  )?.[1];
  if (!path) continue;
  const png = binary('exec-out', 'cat', path);
  assert(
    png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'Capture is not a PNG',
  );
  const filename = `snapshot-${captures.length}.png`;
  writeFileSync(resolve(out, filename), png);
  captures.push({
    filename,
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    elapsedMs: Number(line.match(/snapshotMs=([\d.]+)/)?.[1]),
    seconds: Number(line.match(/seconds=([\d.]+)/)?.[1]),
  });
}
writeFileSync(resolve(out, 'after.png'), binary('exec-out', 'screencap', '-p'));
const report = {
  mode,
  serial,
  pid,
  beforeNativeCount: before,
  afterNativeCount: after,
  captures,
  fontScale: adb('shell', 'settings', 'get', 'system', 'font_scale'),
  density: adb('shell', 'wm', 'density'),
};
writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
assert.equal(before, mode === 'software-host' ? 0 : 1);
assert.equal(after, before, 'Temporary capture changed live renderer');
if (mode !== 'software-host') assert.equal(captures.length, 1, 'Missing bitmap light capture');
console.log(JSON.stringify(report));
