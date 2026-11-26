#!/usr/bin/env node
/**
 * `bloomc …` from npm (`npx bloomc check --tsc`, `bloomc lsp` for an editor):
 * runs the bloomc binary for this machine, with the arguments, stdio and exit
 * code as given. The first that exists is run:
 *
 * 1. A build from this checkout (`scripts/build-addon.sh` puts `bloomc` beside
 *    the package).
 * 2. This platform's package (`@oxy.so/bloom-language-compiler-<platform>`, an
 *    optional dependency CI builds), which carries `bloomc.<platform>` beside
 *    the addon.
 * 3. The WASI build in `@oxy.so/bloom-language-compiler-wasm32-wasi`, run by
 *    Node's WASI with the file system from the root. It runs one file at a time
 *    and cannot start processes, so `check --tsc` needs a native build.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { PACKAGE, SETUP_DOC, WASI, WASI_PLATFORM, cliFile, currentPlatform } = require('./platform');

const LOCAL = path.join(__dirname, '..', process.platform === 'win32' ? 'bloomc.exe' : 'bloomc');

/** The file in package `name` named `file`, if that package is installed and has it. */
function inPackage(name, file, failures) {
  let dir;
  try {
    dir = path.dirname(require.resolve(`${name}/package.json`));
  } catch {
    failures.push(`${name}: not installed`);
    return null;
  }
  const found = path.join(dir, file);
  if (fs.existsSync(found)) return found;
  failures.push(`${name}: has no ${file}`);
  return null;
}

/**
 * The bloomc this machine runs: `{ kind: 'native' | 'wasi', file }`.
 * Throws, naming every place it looked, when there is none.
 */
function locate() {
  if (fs.existsSync(LOCAL)) return { kind: 'native', file: LOCAL };
  const failures = [`${LOCAL}: not built`];
  const platform = currentPlatform();
  const native = platform && inPackage(`${PACKAGE}-${platform}`, cliFile(platform), failures);
  if (native) return { kind: 'native', file: native };
  const wasi = inPackage(WASI, cliFile(WASI_PLATFORM), failures);
  if (wasi) return { kind: 'wasi', file: wasi };
  throw new Error(
    `No bloomc for ${process.platform}-${process.arch}:\n  ${failures.join('\n  ')}\n` +
      `Build it from a checkout (bun run build:addon in packages/bloom-language-compiler), or install the prebuilt package for this platform. See ${SETUP_DOC}`,
  );
}

/**
 * Runs bloomc with `args`, inheriting stdio; resolves to its exit code.
 *
 * @param {string[]} args
 * @param {{ cwd?: string }} [options]
 * @returns {Promise<number>}
 */
async function run(args, { cwd = process.cwd() } = {}) {
  const binary = locate();
  if (binary.kind === 'wasi') return runWasi(binary.file, args, cwd);
  executable(binary.file);
  const result = spawnSync(binary.file, args, { stdio: 'inherit', cwd });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

/**
 * A packed binary's mode survives `npm pack`, but not every route to the
 * registry (an artifact upload drops it): set it once if it was lost.
 */
function executable(file) {
  if (process.platform === 'win32') return;
  const { mode } = fs.statSync(file);
  if ((mode & 0o111) === 0) fs.chmodSync(file, mode | 0o755);
}

/** The options whose next argument is their value, not a path to check. */
const VALUE_OPTIONS = new Set(['--project', '-p', '--out', '--jobs', '-j']);

/** Every `.bloom` file under `dir`, as bloomc's own walk finds them (crates/bloomc/src/files.rs). */
function bloomFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name.startsWith('.') || entry.name === 'node_modules' ? [] : bloomFiles(full);
    }
    return entry.name.endsWith('.bloom') ? [full] : [];
  });
}

/**
 * Node's WASI cannot list a directory on Windows (uvwasi has no `fd_readdir`
 * there: ENOSYS), so a directory given to `check` or `fmt` reaches the WASI
 * build as the `.bloom` files under it.
 */
function wasiArgs(args, cwd, platform = process.platform) {
  if (platform !== 'win32' || (args[0] !== 'check' && args[0] !== 'fmt')) return args;
  return args.flatMap((arg, index) => {
    if (index === 0 || arg.startsWith('-') || VALUE_OPTIONS.has(args[index - 1])) return [arg];
    const full = path.resolve(cwd, arg);
    if (!fs.statSync(full, { throwIfNoEntry: false })?.isDirectory()) return [arg];
    return bloomFiles(full).map((file) => path.relative(cwd, file).split(path.sep).join('/'));
  });
}

/** The WASI build under Node's WASI: `/` is the root (a drive's root on Windows). */
async function runWasi(file, args, cwd) {
  const { WASI: NodeWasi } = require('node:wasi');
  const root = path.parse(cwd).root;
  const inside = `/${path.relative(root, cwd).split(path.sep).join('/')}`;
  const wasi = new NodeWasi({
    version: 'preview1',
    args: ['bloomc', ...wasiArgs(args, cwd)],
    // bloomc starts in PWD (WASI has no working directory of its own).
    env: { ...process.env, PWD: inside },
    preopens: { '/': root },
    returnOnExit: true,
  });
  const module = await WebAssembly.compile(fs.readFileSync(file));
  const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
  return wasi.start(instance);
}

module.exports = { locate, run, runWasi, wasiArgs };

if (require.main === module) {
  run(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`bloomc: ${error.message}`);
      process.exitCode = 2;
    },
  );
}
