// dist/: the grammar for `require` (dist/bloom.cjs) and for a <script> after highlight.js's own,
// as highlight.js's CDN languages are (dist/bloom.min.js registers itself on the global `hljs`).
// Built from src/languages/bloom.js; `--check` fails when the committed files differ.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = new URL('..', import.meta.url).pathname;
const entry = join(root, 'src/languages/bloom.js');
const BANNER =
  '/*! `bloom` grammar for highlight.js 11: Bloom, the language by Oxy. https://github.com/OxyHQ/Bloom (The Breathe License). Built from src/languages/bloom.js. */';

async function bundle(minify) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'hljsGrammar',
    target: 'es2018',
    minify,
    legalComments: 'none',
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

const outputs = {
  'dist/bloom.cjs': `${BANNER}\n${await bundle(false)}module.exports = hljsGrammar.default;\n`,
  'dist/bloom.min.js': `${BANNER}\n(function(){${(await bundle(true)).trim()}hljs.registerLanguage("bloom",hljsGrammar.default)})();\n`,
};

const check = process.argv.includes('--check');
const stale = [];
for (const [file, text] of Object.entries(outputs)) {
  const path = join(root, file);
  let current = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {}
  if (current === text) continue;
  if (check) stale.push(file);
  else writeFileSync(path, text);
}
if (stale.length) {
  console.error(
    `packages/highlightjs-bloom: ${stale.join(', ')} are stale; run \`bun run build\` there.`,
  );
  process.exit(1);
}
