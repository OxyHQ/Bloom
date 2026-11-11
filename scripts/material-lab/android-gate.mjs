import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function requireLabEmulator(
  serial,
  devices,
  avd,
  qemu,
  authorizedPhysicalSerial = undefined,
) {
  const physical = !/^emulator-\d+$/.test(serial);
  assert(
    !physical || serial === authorizedPhysicalSerial,
    'Physical devices require explicit authorization for this exact serial',
  );
  const matches = devices.split('\n').filter((line) => line.split(/\s+/)[0] === serial);
  assert(
    matches.length === 1 && matches[0].split(/\s+/)[1] === 'device',
    'Select exactly one online emulator',
  );
  if (physical) {
    assert.notEqual(qemu.trim(), '1', 'Expected the explicitly authorized physical device');
    return;
  }
  assert.equal(
    avd.trim().split(/\r?\n/)[0].trim(),
    'bloom_material_663',
    'Refusing an existing/unrelated AVD',
  );
  assert.equal(qemu.trim(), '1', 'Target must identify itself as an emulator');
}
export function requireOfflineApk(permissions, badging) {
  assert(
    !permissions.includes('android.permission.INTERNET'),
    'Refusing APK with INTERNET permission',
  );
  assert(badging.includes("package: name='so.oxy.bloom.materiallab'"), 'Unexpected application ID');
}

export function requireLabForeground(focusedWindow) {
  assert(
    focusedWindow.includes('so.oxy.bloom.materiallab/'),
    'Fixture lost foreground ownership; refusing stale coordinates or screenshot',
  );
}

const here = dirname(fileURLToPath(import.meta.url));
async function main() {
  const serial = process.env.ANDROID_SERIAL;
  assert(serial, 'Set ANDROID_SERIAL explicitly');
  assert(
    /^emulator-\d+$/.test(serial) || serial === process.env.AUTHORIZED_PHYSICAL_SERIAL,
    'Physical devices require explicit per-serial authorization',
  );
  const binary = process.env.ADB || 'adb';
  const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [];
  const target = [...server, '-s', serial];
  const adb = (...args) =>
    execFileSync(binary, [...target, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  requireLabEmulator(
    serial,
    execFileSync(binary, [...server, 'devices'], { encoding: 'utf8' }),
    /^emulator-/.test(serial) ? adb('emu', 'avd', 'name') : '',
    adb('shell', 'getprop', 'ro.kernel.qemu'),
    process.env.AUTHORIZED_PHYSICAL_SERIAL,
  );
  const sdk = process.env.ANDROID_HOME;
  assert(sdk, 'Set ANDROID_HOME');
  const latest = readdirSync(resolve(sdk, 'build-tools'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .at(-1);
  const aapt = resolve(sdk, 'build-tools', latest, 'aapt');
  const apk = resolve(
    here,
    process.env.APK || 'android/app/build/outputs/apk/release/app-release.apk',
  );
  const permissions = execFileSync(aapt, ['dump', 'permissions', apk], { encoding: 'utf8' });
  const badging = execFileSync(aapt, ['dump', 'badging', apk], { encoding: 'utf8' });
  requireOfflineApk(permissions, badging);
  execFileSync(process.execPath, [resolve(here, 'attest-build.mjs')], {
    env: { ...process.env, APK: apk },
    stdio: 'inherit',
  });
  if (process.env.INSTALL_APK) {
    assert(process.env.INSTALL_APK_LOCAL, 'Set the local path to the staged install APK');
    assert(
      readFileSync(process.env.INSTALL_APK_LOCAL).equals(readFileSync(apk)),
      'Staged APK differs from the inspected artifact',
    );
  }
  const out = resolve(here, process.env.OUT || '../../.local/material-android');
  mkdirSync(out, { recursive: true });
  const report = {
    serial,
    avd: /^emulator-/.test(serial) ? 'bloom_material_663' : null,
    apk,
    apkSha256: createHash('sha256').update(readFileSync(apk)).digest('hex'),
    build: JSON.parse(readFileSync(resolve(here, 'attestation.json'), 'utf8')),
    permissions,
    os: adb('shell', 'getprop', 'ro.build.version.release'),
    api: adb('shell', 'getprop', 'ro.build.version.sdk'),
    abi: adb('shell', 'getprop', 'ro.product.cpu.abi'),
    hardware: adb('shell', 'getprop', 'ro.hardware'),
    size: adb('shell', 'wm', 'size'),
    density: adb('shell', 'wm', 'density'),
    fontScale: adb('shell', 'settings', 'get', 'system', 'font_scale'),
    gpu: adb('shell', 'dumpsys', 'SurfaceFlinger')
      .split(/\r?\n/)
      .filter((line) => /GLES:/.test(line)),
    fingerprint: adb('shell', 'getprop', 'ro.build.fingerprint'),
    display: adb('shell', 'dumpsys', 'display'),
  };
  writeFileSync(resolve(out, 'environment.json'), JSON.stringify(report, null, 2));
  adb('install', '-r', process.env.INSTALL_APK || apk);
  adb('shell', 'am', 'force-stop', 'so.oxy.bloom.materiallab');
  adb('shell', 'am', 'start', '-W', '-n', 'so.oxy.bloom.materiallab/.MainActivity');
  await new Promise((done) => setTimeout(done, 12000));
  const pid = adb('shell', 'pidof', 'so.oxy.bloom.materiallab').trim();
  assert(pid, 'Fixture process exited during startup');
  const logs = adb('logcat', '-d', '--pid', pid);
  writeFileSync(resolve(out, 'startup.log'), logs);
  writeFileSync(
    resolve(out, 'initial.png'),
    execFileSync(binary, [...target, 'exec-out', 'screencap', '-p']),
  );
  // The scene is mounted only after both negative probes reject. The build
  // footer may be outside the initial viewport; require its guarded root.
  adb('shell', 'uiautomator', 'dump', '/sdcard/bloom-material-663.xml');
  const hierarchy = adb('shell', 'cat', '/sdcard/bloom-material-663.xml');
  writeFileSync(resolve(out, 'initial.xml'), hierarchy);
  assert(
    hierarchy.includes('material-scene'),
    'Runtime negative HTTP/WebSocket probes did not pass',
  );
  console.log(`Offline fixture running on ${serial}; evidence: ${out}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
