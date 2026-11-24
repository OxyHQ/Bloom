// @ts-check
/**
 * THE PUBLISHED lib/ IS WHAT THE REACT COMPILER MAKES OF src/.
 *
 *   node scripts/verify-react-compiler.mjs [--control <src file>]   # cwd = the package
 *
 * Apps compile their own code with the React Compiler, but babel-preset-expo
 * skips node_modules, so a Bloom component is memoized only if the package
 * shipped it compiled. bob builds every JS target with `babel.build.cjs`
 * (`configFile`), which runs the compiler; this gate fails when that stops
 * being true, and prints what the compiler would not compile.
 *
 * ## What it compares
 *
 * The expectation is DERIVED, never listed: every source file bob compiles is
 * run through the compiler plugin and the options bob's own config resolves to
 * (loaded from that config, so the two cannot drift), counting the functions it
 * memoized. Each built file must then call the memo cache exactly that many
 * times, in every JS target. A target built without the compiler, a config
 * that dropped the plugin, or a lib/ built from older source fails here, and
 * so does a built file the compiler gave a different shape to.
 *
 * ## Controls
 *
 * - The corpus is the files bob compiles (bob's own `glob` and `exclude`); the
 *   counts of files examined, functions compiled and bail-outs are printed, so
 *   a shrunken corpus is visible. Zero source files, or zero compiled
 *   functions, fail.
 * - `--control <file>`: a component chosen explicitly that must compile and
 *   must be compiled in lib/. It guards against the compiler silently
 *   compiling nothing anywhere (an options change both sides would share).
 *
 * Bail-outs are not failures: the compiler leaves those functions as written,
 * which is the behaviour they had before. They are printed so they stay seen.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const bobRequire = createRequire(require.resolve('react-native-builder-bob/package.json'));
const babel = bobRequire('@babel/core');
const { glob } = bobRequire('glob');

const args = process.argv.slice(2);
const controlIndex = args.indexOf('--control');
const control = controlIndex === -1 ? null : args[controlIndex + 1];
const verbose = args.includes('--verbose');

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const bob = pkg['react-native-builder-bob'];
const failures = [];
const fail = (message) => failures.push(message);

if (!bob) {
  console.error(`verify-react-compiler: ${pkg.name} has no react-native-builder-bob config`);
  process.exit(1);
}

/** The JS targets and where each writes, with the cache call each one emits. */
const MARKERS = {
  // `import { c as _c } from "react/compiler-runtime"` … `const $ = _c(4);`
  module: /\b_c\d*\(\d+\)/g,
  // `var _compilerRuntime = require("react/compiler-runtime")` … `(0, _compilerRuntime.c)(4)`
  commonjs: /\b_compilerRuntime\d*\.c\)\(\d+\)/g,
};
const targets = bob.targets
  .map((target) => (Array.isArray(target) ? target : [target, {}]))
  .filter(([name]) => name === 'module' || name === 'commonjs')
  .map(([name, options]) => ({
    name,
    configFile: options?.configFile,
    output: path.join(root, bob.output, name),
  }));

if (targets.length === 0) fail('no commonjs or module target to verify');
for (const target of targets) {
  if (typeof target.configFile !== 'string') {
    fail(`the ${target.name} target does not build with babel.build.cjs (no configFile)`);
  }
}
const configFiles = [...new Set(targets.map((target) => target.configFile))];
if (configFiles.length > 1) fail(`the JS targets build with different configs: ${configFiles}`);

const sourceDir = path.join(root, bob.source);
const files = (
  await glob('**/*', { cwd: sourceDir, absolute: true, nodir: true, ignore: bob.exclude })
)
  .filter((file) => /\.[cm]?[jt]sx?$/.test(file) && !/\.d\.[cm]?ts$/.test(file))
  .sort();
if (files.length === 0) fail(`no source files under ${bob.source}`);

/** The compiler plugin and its options, exactly as bob's config resolves them. */
function compilerFromConfig(configFile) {
  const partial = babel.loadPartialConfig({
    cwd: root,
    configFile: path.resolve(root, configFile),
    babelrc: false,
    filename: files[0],
    caller: { name: 'react-native-builder-bob' },
  });
  const item = partial?.options.plugins?.find((plugin) =>
    /[\\/]babel-plugin-react-compiler[\\/]/.test(plugin.file?.resolved ?? ''),
  );
  return item ? { plugin: item.value, options: item.options ?? {} } : null;
}

const compiler =
  failures.length === 0 && typeof configFiles[0] === 'string'
    ? compilerFromConfig(configFiles[0])
    : null;
if (failures.length === 0 && !compiler)
  fail(`${configFiles[0]} does not run babel-plugin-react-compiler`);

let compiledTotal = 0;
let controlCompiled = 0;
/** Functions the compiler left as written: `file:line:column` -> reasons. */
const bailouts = new Map();
const bailout = (relative, loc, reason) => {
  const key = `${relative}:${position(loc)}`;
  if (!bailouts.has(key)) bailouts.set(key, new Set());
  bailouts.get(key).add(reason);
};
const position = (loc) => (loc ? `${loc.start.line}:${loc.start.column}` : '?');

if (compiler) {
  for (const file of files) {
    const relative = path.relative(sourceDir, file);
    let compiled = 0;
    babel.transformSync(readFileSync(file, 'utf8'), {
      filename: file,
      cwd: root,
      babelrc: false,
      configFile: false,
      code: false,
      parserOpts: { plugins: ['typescript', 'jsx'] },
      plugins: [
        [
          compiler.plugin,
          {
            ...compiler.options,
            logger: {
              logEvent(_filename, event) {
                if (event.kind === 'CompileSuccess') {
                  if (event.memoSlots > 0) compiled += 1;
                } else if (event.kind === 'CompileError') {
                  const detail = event.detail;
                  const reason = detail.reason ?? detail.options?.reason ?? String(detail);
                  bailout(relative, event.fnLoc, reason);
                } else if (event.kind === 'PipelineError') {
                  bailout(relative, event.fnLoc, `pipeline error: ${event.data}`);
                }
              },
            },
          },
        ],
      ],
    });
    compiledTotal += compiled;
    if (control && path.resolve(root, control) === file) controlCompiled = compiled;

    for (const target of targets) {
      const built = path.join(target.output, relative.replace(/\.([cm])?[jt]sx?$/, '.$1js'));
      if (!existsSync(built)) {
        fail(`${path.relative(root, built)} is missing (run the build)`);
        continue;
      }
      const calls = readFileSync(built, 'utf8').match(MARKERS[target.name])?.length ?? 0;
      if (calls !== compiled) {
        fail(
          `${path.relative(root, built)}: ${calls} memo cache calls, the compiler makes ${compiled} of ${relative}`,
        );
      }
    }
  }
}

if (compiler && compiledTotal === 0) fail('the compiler memoized no function in any source file');
if (control) {
  if (!files.includes(path.resolve(root, control)))
    fail(`control ${control} is not a source bob compiles`);
  else if (controlCompiled === 0) fail(`control ${control} has no compiled component`);
}

console.log(
  `verify-react-compiler: ${pkg.name}: ${files.length} source files, ${compiledTotal} functions memoized, ` +
    `${bailouts.size} left as written, ${targets.map((t) => t.name).join(' + ')} checked`,
);
if (bailouts.size > 0) {
  const byReason = new Map();
  for (const reasons of bailouts.values()) {
    for (const reason of reasons) byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
  }
  console.log('  why the compiler left functions as written (functions per reason):');
  for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(count).padStart(5)}  ${reason}`);
  }
  if (verbose) {
    for (const [key, reasons] of [...bailouts].sort())
      console.log(`    ${key}  ${[...reasons].join('; ')}`);
  } else {
    console.log('  (--verbose lists every function)');
  }
}
if (failures.length > 0) {
  console.error(`verify-react-compiler: ${failures.length} failure(s)`);
  for (const message of failures.slice(0, 40)) console.error(`  ${message}`);
  process.exit(1);
}
