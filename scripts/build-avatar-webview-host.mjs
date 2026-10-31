/** Builds an isolated Android WebView test APK; does not install or launch it. */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
const sdk = process.env.ANDROID_HOME || join(homedir(), 'Android/Sdk');
const version = readdirSync(join(sdk, 'build-tools'))
  .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .at(-1);
if (!version) throw Error('Android SDK build tools are required');
const tools = join(sdk, 'build-tools', version);
const platform = join(sdk, 'platforms/android-35/android.jar');
const fixture = resolve('scripts/fixtures/avatar/native-host');
const output = resolve(process.env.AVATAR_WEBVIEW_HOST_OUTPUT || '.local/avatar-webview-host');
mkdirSync(join(output, 'classes'), { recursive: true });
mkdirSync(join(output, 'dex'), { recursive: true });
const run = (command, args) => execFileSync(command, args, { cwd: output, stdio: 'inherit' });
run('javac', [
  '-source',
  '8',
  '-target',
  '8',
  '-classpath',
  platform,
  '-d',
  'classes',
  join(fixture, 'MainActivity.java'),
]);
run(join(tools, 'd8'), [
  '--lib',
  platform,
  '--output',
  'dex',
  'classes/so/oxy/bloom/avatarbenchmark/MainActivity.class',
]);
run(join(tools, 'aapt2'), [
  'link',
  '-o',
  'unsigned.apk',
  '--manifest',
  join(fixture, 'AndroidManifest.xml'),
  '-I',
  platform,
]);
run('zip', ['-j', 'unsigned.apk', 'dex/classes.dex']);
run(join(tools, 'zipalign'), ['-f', '4', 'unsigned.apk', 'aligned.apk']);
if (!existsSync(join(output, 'debug.keystore')))
  run('keytool', [
    '-genkeypair',
    '-keystore',
    'debug.keystore',
    '-storepass',
    'android',
    '-keypass',
    'android',
    '-alias',
    'avatar-bench',
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '3650',
    '-dname',
    'CN=Bloom Avatar Test',
  ]);
run(join(tools, 'apksigner'), [
  'sign',
  '--ks',
  'debug.keystore',
  '--ks-key-alias',
  'avatar-bench',
  '--ks-pass',
  'pass:android',
  '--key-pass',
  'pass:android',
  '--out',
  'avatar-benchmark.apk',
  'aligned.apk',
]);
console.log(join(output, 'avatar-benchmark.apk'));
