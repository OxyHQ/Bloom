// Map snippets of the release bundle back through Metro's source map and
// print where each lands in the source the author wrote.
//
//   node e2e/verify.mjs e2e/dist/index.android.bundle
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Metro writes a sectioned (index) map, one section per module.
const { FlattenMap, originalPositionFor } = require('@jridgewell/trace-mapping');

const bundlePath = process.argv[2];
const bundle = readFileSync(bundlePath, 'utf8').split('\n');
const trace = new FlattenMap(readFileSync(`${bundlePath}.map`, 'utf8'));

const probes = [
  ['e.Hello=function', 'padding:12', 'the hoisted HStack style'],
  ['e.Hello=function', 'children:"x"', 'the hoisted Text element'],
  ['e.PostRow=function', 'author.name}', 'a runtime value inside the compiled tree'],
  ['e.PostRow=function', 'gap:8', 'the runtime-token table for .spacing(gap)'],
];

for (const [moduleMarker, snippet, what] of probes) {
  const line = bundle.findIndex((text) => text.includes(moduleMarker));
  const column = bundle[line].indexOf(snippet);
  const original = originalPositionFor(trace, { line: line + 1, column });
  const source = original.source?.replace(/^.*\/(fixtures\/)/, '$1');
  console.log(`${what}: \`${snippet}\` -> ${source}:${original.line}:${original.column + 1}`);
}
