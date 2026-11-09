import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const serial = process.env.ANDROID_SERIAL;
assert(serial, 'Explicit device serial required');
const emulator = /^emulator-\d+$/.test(serial);
if (!emulator)
  assert.equal(
    serial,
    process.env.AUTHORIZED_PHYSICAL_SERIAL,
    'Explicit physical serial authorization required',
  );
const binary = process.env.ADB;
assert(
  binary &&
    process.env.ANDROID_HOME &&
    process.env.APK &&
    process.env.ATTESTATION &&
    process.env.OUT,
);
const prefix = [...(process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : []), '-s', serial];
const adb = (...args) =>
  execFileSync(binary, [...prefix, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
const hash = (data) => createHash('sha256').update(data).digest('hex');
const apk = resolve(process.env.APK);
const receipt = JSON.parse(readFileSync(resolve(process.env.ATTESTATION), 'utf8'));
assert.equal(hash(readFileSync(apk)), receipt.apkSha256, 'APK differs from attested artifact');
const pkg = process.env.PACKAGE || 'so.oxy.bloom.loaderpackagelab';
assert(['so.oxy.bloom.loaderpackagelab', 'so.oxy.bloom.materiallab'].includes(pkg));
const aapt = resolve(
  process.env.ANDROID_HOME,
  'build-tools',
  process.env.BUILD_TOOLS || '36.0.0',
  'aapt',
);
const badging = execFileSync(aapt, ['dump', 'badging', apk], { encoding: 'utf8' });
const permissions = execFileSync(aapt, ['dump', 'permissions', apk], { encoding: 'utf8' });
assert(badging.includes(`package: name='${pkg}'`));
assert(
  !permissions.includes('android.permission.INTERNET'),
  'Synthetic release must remain offline',
);
assert.equal(adb('get-state'), 'device');
if (emulator) {
  const ownedAvd = {
    'emulator-5580': 'bloom_material_663',
    'emulator-5582': 'bloom_loader_api30_663',
  }[serial];
  assert(ownedAvd, 'Only this task’s dedicated AVD serials');
  assert.equal(adb('emu', 'avd', 'name').split(/\r?\n/)[0], ownedAvd);
  assert.equal(adb('shell', 'getprop', 'ro.kernel.qemu'), '1');
}
const abi = adb('shell', 'getprop', 'ro.product.cpu.abi');
assert(
  badging
    .split('\n')
    .find((line) => line.startsWith('native-code:'))
    ?.includes(`'${abi}'`),
  'Device ABI mismatch',
);
let installPath = apk;
if (binary.endsWith('.exe')) {
  assert(
    process.env.INSTALL_APK_LOCAL && process.env.INSTALL_APK,
    'Explicit owned Windows staging paths required',
  );
  copyFileSync(apk, process.env.INSTALL_APK_LOCAL);
  assert.equal(hash(readFileSync(process.env.INSTALL_APK_LOCAL)), receipt.apkSha256);
  installPath = process.env.INSTALL_APK;
}
const out = resolve(process.env.OUT);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'badging.txt'), badging);
writeFileSync(resolve(out, 'permissions.txt'), permissions);
const environment = {
  serial,
  package: pkg,
  apkSha256: receipt.apkSha256,
  build: receipt,
  fingerprint: adb('shell', 'getprop', 'ro.build.fingerprint'),
  api: adb('shell', 'getprop', 'ro.build.version.sdk'),
  abi,
  density: adb('shell', 'wm', 'density'),
  size: adb('shell', 'wm', 'size'),
  fontScale: adb('shell', 'settings', 'get', 'system', 'font_scale'),
  thermal: adb('shell', 'dumpsys', 'thermalservice'),
};
writeFileSync(resolve(out, 'environment.json'), JSON.stringify(environment, null, 2));
console.log(adb('install', '-r', installPath));
console.log(adb('shell', 'am', 'start', '-n', `${pkg}/.MainActivity`));
