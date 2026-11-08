import './generate-hardware-loader.mjs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const files = [
  'templates/material/MaterialScene.tsx',
  'scripts/material-lab/MaterialLab.tsx',
  'scripts/material-lab/LoaderBenchmark.tsx',
  'scripts/material-lab/HardwareLight.tsx',
  'scripts/material-lab/HardwareLoader.generated.tsx',
  'scripts/material-lab/generate-hardware-loader.mjs',
  'scripts/material-lab/with-hardware-light.js',
  'scripts/material-lab/native/BloomLightProbe.kt',
  'scripts/material-lab/bun.lock',
  'scripts/material-lab/package.json',
  'scripts/material-lab/app.config.js',
  'scripts/material-lab/babel.config.js',
  'scripts/material-lab/metro.config.js',
  'scripts/material-lab/global.css',
  'scripts/material-lab/postcss.config.js',
  'scripts/material-lab/without-network.js',
  'scripts/material-lab/source-inputs.js',
  'scripts/material-lab/path-probe.js',
  'templates/ai-chat/assets/gallery/beach-kid.webp',
];
const sourceHash = createHash('sha256');
let sourceFiles = 0;
function addSource(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) addSource(file);
    else if (entry.isFile()) {
      sourceHash.update(relative(root, file)).update(readFileSync(file));
      sourceFiles++;
    }
  }
}
addSource(resolve(root, 'src'));
const hash = createHash('sha256');
for (const name of files) hash.update(name).update(readFileSync(resolve(root, name)));
writeFileSync(
  resolve(here, 'build.json'),
  JSON.stringify(
    {
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      workingTree: execFileSync('git', ['status', '--porcelain'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      fixtureSha256: hash.digest('hex'),
      sourceSha256: sourceHash.digest('hex'),
      sourceFiles,
      lockSha256: createHash('sha256')
        .update(readFileSync(resolve(here, 'bun.lock')))
        .digest('hex'),
      scene: process.env.BLOOM_LAB_SCENE || 'material',
      variant: process.env.BLOOM_LAB_VARIANT || 'production-svg',
      fixedOpticsTime:
        process.env.BLOOM_LAB_FIXED_TIME === undefined
          ? null
          : Number(process.env.BLOOM_LAB_FIXED_TIME),
      artifactKind: 'source fixture; native Bloom module from published 17.22.0',
      reactCompiler: false,
      dependencies: JSON.parse(readFileSync(resolve(here, 'package.json'), 'utf8')).dependencies,
    },
    null,
    2,
  ),
);
