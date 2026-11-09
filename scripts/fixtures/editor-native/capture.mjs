// Capture only: this never reports a native acceptance pass or changes app focus.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const { ADB, ANDROID_SERIAL, APP_ID, BLOOM_VERSION, EDITOR_VERSION } = process.env;
assert(
  ADB && ANDROID_SERIAL && APP_ID && BLOOM_VERSION && EDITOR_VERSION,
  'Set the coordinated ADB executable/server, device serial, fixture app ID and exact package versions',
);
const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [];
const target = [...server, '-s', ANDROID_SERIAL];
const adb = (...args) =>
  execFileSync(ADB, [...target, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const windows = adb('shell', 'dumpsys', 'window');
assert(
  windows
    .split('\n')
    .some((line) => /mCurrentFocus|mFocusedApp/.test(line) && line.includes(APP_ID)),
  'Fixture must already own the foreground window',
);
const output = resolve(process.env.OUTPUT ?? '.local/editor-native-capture');
mkdirSync(output, { recursive: true });
const ime = adb('shell', 'dumpsys', 'input_method');
writeFileSync(resolve(output, 'ime.txt'), ime);
adb('shell', 'uiautomator', 'dump', '/sdcard/editor-434.xml');
writeFileSync(resolve(output, 'hierarchy.xml'), adb('shell', 'cat', '/sdcard/editor-434.xml'));
writeFileSync(
  resolve(output, 'screen.png'),
  execFileSync(ADB, [...target, 'exec-out', 'screencap', '-p'], { maxBuffer: 16 * 1024 * 1024 }),
);
const logs = adb('logcat', '-d', '-t', '2000')
  .split('\n')
  .filter((line) => line.includes('EDITOR434'));
writeFileSync(resolve(output, 'editor.log'), logs.join('\n'));
writeFileSync(
  resolve(output, 'capture.json'),
  JSON.stringify(
    {
      status: 'captured-not-evaluated',
      at: new Date().toISOString(),
      serial: ANDROID_SERIAL,
      app: APP_ID,
      bloom: BLOOM_VERSION,
      editor: EDITOR_VERSION,
      model: adb('shell', 'getprop', 'ro.product.model').trim(),
      sdk: adb('shell', 'getprop', 'ro.build.version.sdk').trim(),
    },
    null,
    2,
  ) + '\n',
);
