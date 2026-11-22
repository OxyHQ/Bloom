#!/usr/bin/env node
// Checks an install of the packed compiler (CI: language-compiler-binaries.yml),
// run from the installing project with no Rust on PATH:
//
//   node verify-prebuilt.cjs <fixtures-dir> [--wasi]
//
// The compiler loads its prebuilt addon (or, with --wasi and no addon for this
// platform installed, the WASI build), and when the WASI package is installed
// too, the two compile every fixture to the same output.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const [fixtures, mode] = process.argv.slice(2);
const project = process.cwd();
const from = (request) => require.resolve(request, { paths: [project] });

// The loader itself (not an export of the package), from the installed package's directory.
const installed = path.dirname(from('@oxy.so/bloom-language-compiler/package.json'));
const native = require(path.join(installed, 'js', 'native.js'));
// The compiler loaded an installed package's build, never a local one.
const kind = mode === '--wasi' ? 'wasm32-wasi' : 'prebuilt';
assert.match(
  native.binary,
  mode === '--wasi'
    ? /bloom-language-compiler-wasm32-wasi/
    : /bloom-language-compiler-(darwin|linux|win32)-/,
  native.binary,
);

let wasi;
try {
  wasi = require(from('@oxy.so/bloom-language-compiler-wasm32-wasi'));
} catch {
  wasi = undefined;
}
if (mode === '--wasi') assert.ok(wasi, 'the WASI package is installed');

let compared = 0;
for (const file of fs.readdirSync(fixtures).sort()) {
  if (!/\.tsx?$/.test(file) || file.endsWith('.compiled.tsx')) continue;
  const source = fs.readFileSync(path.join(fixtures, file), 'utf8');
  const output = native.compile(source, file);
  assert.equal(output.diagnostics.length, 0, `${file}: ${output.diagnostics[0]?.rendered}`);
  if (wasi) assert.deepEqual({ ...wasi.compile(source, file) }, { ...output }, file);
  compared += 1;
}
assert.ok(compared > 0, `no fixtures in ${fixtures}`);
console.log(
  `${kind}: ${compared} fixtures compiled${wasi ? ', the same through the WASI build' : ''} (digest ${native.digest.slice(0, 12)})`,
);
