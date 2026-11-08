import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, '../../src/composer-loader/ComposerLoader.tsx');
const source = readFileSync(sourcePath, 'utf8');
let copy = source.replace(/from '([.][^']+)'/g, (_, name) => {
  let target = relative(here, resolve(dirname(sourcePath), name));
  if (!target.startsWith('.')) target = `./${target}`;
  return `from '${target}'`;
});
const svg = /\{measured \? \(\n {10}<Svg[\s\S]*? {10}<\/Svg>\n {8}\) : null\}/g;
assert.equal(
  [...copy.matchAll(svg)].length,
  1,
  'Generate the probe from the production SVG renderer, not another experiment',
);
copy = copy.replace(
  svg,
  `{measured ? <HardwareLight geometry={geometry} time={time} speed={speed} reverse={reverse}
  colors={[c0, c1, gradientMidColor(c1, c2), c2, c3]} intensity={intensity} width={box.w} height={box.h} /> : null}`,
);
if (process.env.BLOOM_LAB_FIXED_TIME !== undefined) {
  const fixed = Number(process.env.BLOOM_LAB_FIXED_TIME);
  assert(Number.isFinite(fixed) && fixed >= 0, 'Fixed optics time must be finite and nonnegative');
  const clock = 'time.value += (frame.timeSincePreviousFrame ?? 0) / 1000;';
  assert(copy.includes(clock), 'Find the real frame clock before fixing optics phase');
  copy = copy.replace(clock, `time.value = ${fixed};`);
}
copy = `// Generated private renderer probe. Original source SHA256 ${createHash('sha256').update(source).digest('hex')}\nimport { HardwareLight } from './HardwareLight';\n${copy}`;
writeFileSync(resolve(here, 'HardwareLoader.generated.tsx'), copy);
writeFileSync(
  resolve(here, 'HardwareLoader.generated.web.tsx'),
  "export { ComposerLoader } from '../../src/composer-loader/ComposerLoader.web';\n",
);
