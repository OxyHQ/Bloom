#!/usr/bin/env node
/**
 * `bloom-lang-dts [--root <dir>] <files or directories…>`: writes
 * `Name.d.bloom.ts` beside each `Name.bloom`, the declarations TypeScript
 * reads for `import { Name } from './Name.bloom'` (with
 * `allowArbitraryExtensions`). A directory is searched for `.bloom` files,
 * skipping `node_modules` and hidden directories. TS imports resolve from
 * `--root` (the working directory by default): its tsconfig's `paths`, its
 * `node_modules`. A file that does not compile prints its diagnostics, and
 * the run exits 1. A declaration file is rewritten only when it changes.
 */
const fs = require('node:fs');
const path = require('node:path');

const { compileBloom } = require('./native');

function bloomFiles(target, out) {
  if (!fs.statSync(target).isDirectory()) {
    out.push(target);
    return out;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') bloomFiles(full, out);
    } else if (entry.name.endsWith('.bloom')) {
      out.push(full);
    }
  }
  return out;
}

function main(argv) {
  let root = process.cwd();
  const targets = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = path.resolve(argv[++i] ?? '.');
    else targets.push(path.resolve(argv[i]));
  }
  if (targets.length === 0) {
    console.error('usage: bloom-lang-dts [--root <dir>] <files or directories…>');
    return 2;
  }
  let failed = 0;
  let written = 0;
  const files = targets.flatMap((target) => bloomFiles(target, []));
  for (const file of files) {
    const output = compileBloom(fs.readFileSync(file, 'utf8'), file, { root });
    for (const warning of output.warnings) console.warn(warning.rendered);
    if (output.diagnostics.length > 0 || output.dts == null) {
      for (const diagnostic of output.diagnostics) console.error(diagnostic.rendered);
      failed++;
      continue;
    }
    const target = file.replace(/\.bloom$/, '.d.bloom.ts');
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (current !== output.dts) {
      fs.writeFileSync(target, output.dts);
      written++;
    }
  }
  console.error(`bloom-lang-dts: ${files.length} files, ${written} written, ${failed} failed`);
  return failed > 0 ? 1 : 0;
}

module.exports = { main };

if (require.main === module) process.exitCode = main(process.argv.slice(2));
