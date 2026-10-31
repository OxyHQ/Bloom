import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readlinkSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

const script = resolve(__dirname, '../../scripts/mirror-into-consumer.mjs');
let root: string;
let source: string;
let consumer: string;
let install: string;
let target: string;
let originalLink: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'bloom-mirror-test-'));
  source = join(root, 'source');
  consumer = join(root, 'consumer');
  install = join(consumer, 'node_modules/@oxy.so/bloom');
  target = join(consumer, 'node_modules/.bun/bloom@published/node_modules/@oxy.so/bloom');
  mkdirSync(join(source, 'src'), { recursive: true });
  writeFileSync(join(source, 'src/index.ts'), 'export const localMarker = 1;\n');
  mkdirSync(join(source, 'lib'), { recursive: true });
  writeFileSync(join(source, 'lib/index.js'), 'module.exports = "local-built-marker";\n');
  writeFileSync(
    join(source, 'package.json'),
    JSON.stringify({
      name: '@oxy.so/bloom',
      version: '99.0.0',
      main: './lib/index.js',
      exports: {
        '.': { 'react-native': { default: './src/index.ts' }, default: './lib/index.js' },
      },
    }),
  );
  mkdirSync(target, { recursive: true });
  writeFileSync(
    join(target, 'package.json'),
    JSON.stringify({ name: '@oxy.so/bloom', version: '1.0.0' }),
  );
  mkdirSync(dirname(install), { recursive: true });
  originalLink = relative(dirname(install), target);
  symlinkSync(originalLink, install);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
const run = (...args: string[]) =>
  execFileSync(process.execPath, [script, consumer, ...args], { encoding: 'utf8' });

it('mirrors an isolated Bun symlink idempotently and restores the original link', () => {
  run(`--source=${source}`);
  expect(readlinkSync(install)).toBe(relative(dirname(install), join(consumer, 'bloom-local')));
  expect(readlinkSync(join(dirname(install), '.bloom-published'))).toBe(originalLink);
  expect(readFileSync(join(install, 'src/index.ts'), 'utf8')).toContain('localMarker');
  run(`--source=${source}`);
  run('--restore');
  expect(lstatSync(install).isSymbolicLink()).toBe(true);
  expect(readlinkSync(install)).toBe(originalLink);
  expect(existsSync(join(consumer, 'bloom-local'))).toBe(false);
  expect(existsSync(join(dirname(install), '.bloom-published'))).toBe(false);
});

it('refuses an existing backup instead of destroying it or changing the install', () => {
  const backup = join(dirname(install), '.bloom-published');
  writeFileSync(backup, 'keep me');
  const result = spawnSync(process.execPath, [script, consumer, `--source=${source}`], {
    encoding: 'utf8',
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('saved install already exists');
  expect(readFileSync(backup, 'utf8')).toBe('keep me');
  expect(readlinkSync(install)).toBe(originalLink);
});

it('does not replace a different symlink during restore', () => {
  run(`--source=${source}`);
  const replacement = join(root, 'replacement');
  mkdirSync(replacement);
  rmSync(install);
  symlinkSync(replacement, install);
  const result = spawnSync(process.execPath, [script, consumer, '--restore'], { encoding: 'utf8' });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('install changed while mirrored');
  expect(readlinkSync(install)).toBe(replacement);
  expect(readlinkSync(join(dirname(install), '.bloom-published'))).toBe(originalLink);
  expect(readFileSync(join(consumer, 'bloom-local/src/index.ts'), 'utf8')).toContain('localMarker');
});

it('replaces every Bun workspace link with the same packed snapshot and restores literal targets', () => {
  const nested = ['packages/accounts', 'packages/services', 'packages/alia'].map((p) =>
    join(consumer, p, 'node_modules/@oxy.so/bloom'),
  );
  for (const path of nested) {
    mkdirSync(dirname(path), { recursive: true });
    symlinkSync(relative(dirname(path), target), path);
  }
  const all = [install, ...nested];
  const original = all.map((path) => readlinkSync(path));
  for (const path of all)
    expect(JSON.parse(readFileSync(join(path, 'package.json'), 'utf8')).version).toBe('1.0.0');
  run(`--source=${source}`, '--built');
  for (const path of all) {
    expect(resolve(dirname(path), readlinkSync(path))).toBe(
      join(consumer, 'bloom-local/node_modules/@oxy.so/bloom'),
    );
    expect(readFileSync(join(path, 'lib/index.js'), 'utf8')).toContain('local-built-marker');
  }
  run(`--source=${source}`, '--built');
  run('--restore');
  expect(all.map((path) => readlinkSync(path))).toEqual(original);
  expect(JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')).version).toBe('1.0.0');
});

it('retains an active mirror if its original backup is missing', () => {
  run(`--source=${source}`);
  rmSync(join(dirname(install), '.bloom-published'));
  const result = spawnSync(process.execPath, [script, consumer, '--restore'], { encoding: 'utf8' });
  expect(result.status).not.toBe(0);
  expect(readFileSync(join(install, 'src/index.ts'), 'utf8')).toContain('localMarker');
});
