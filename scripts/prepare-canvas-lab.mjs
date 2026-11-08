import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] ?? '.local/canvas-lab');
assert.equal(
  dirname(out),
  resolve(root, '.local'),
  'Fixture must remain under this checkout .local',
);
assert(!existsSync(out), 'Preserve existing build evidence; choose a fresh .local directory');
// Reuse the reviewed offline fixture gates/config rather than another Android setup.
const base = 'd739013';
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'scripts/material-lab'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n');
for (const file of files) {
  const name = file.slice('scripts/material-lab/'.length),
    target = resolve(out, name);
  mkdirSync(dirname(target), { recursive: true });
  let text = execFileSync('git', ['show', `${base}:${file}`], { cwd: root, encoding: 'utf8' });
  text = text
    .replaceAll('so.oxy.bloom.materiallab', 'so.oxy.bloom.canvaslab')
    .replaceAll('scripts/material-lab', relative(root, out));
  if (name === 'MaterialLab.tsx')
    text = readFileSync(resolve(root, 'scripts/canvas-lab/CanvasLab.tsx'), 'utf8');
  if (name === 'prepare.mjs')
    text = text
      .replace("  'templates/material/MaterialScene.tsx',", "  'src/canvas/Canvas.stories.tsx',")
      .replace("  'templates/ai-chat/assets/gallery/beach-kid.webp',\n", '');
  if (name === 'source-inputs.js')
    text = text.replace(
      '    task.inputs.dir(new File(rootDir, "../../../templates/material"))\n',
      '',
    );
  if (name === 'app.config.js')
    text = text
      .replaceAll('Bloom Material Lab', 'Bloom Canvas Lab')
      .replaceAll('bloom-material-lab', 'bloom-canvas-lab');
  if (name === 'android-gate.mjs')
    text = text
      .replace("hierarchy.includes('material-scene')", "hierarchy.includes('fixture-canvas')")
      .replaceAll('/sdcard/bloom-material-663.xml', '/sdcard/bloom-canvas-663.xml');
  writeFileSync(target, text);
}
console.log(
  `Prepared offline Canvas fixture at ${out}; install its exact lock with Bun, then prebuild/build.`,
);
