import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const localPackage = resolve(here, 'bloom-local/node_modules/@oxy.so/bloom');
const localPackageMarker = resolve(here, 'bloom-local/.built-sha256');
const installedPackage = existsSync(localPackageMarker)
  ? localPackage
  : resolve(here, 'node_modules/@oxy.so/bloom');
const nativePackage = JSON.parse(readFileSync(resolve(installedPackage, 'package.json'), 'utf8'));
const localPackageSha256 = existsSync(localPackageMarker)
  ? readFileSync(localPackageMarker, 'utf8').trim()
  : null;
const files = [
  'templates/material/MaterialScene.tsx',
  'scripts/material-lab/MaterialLab.tsx',
  'scripts/material-lab/bun.lock',
  'scripts/material-lab/package.json',
  'scripts/material-lab/app.config.js',
  'scripts/material-lab/babel.config.js',
  'scripts/material-lab/metro.config.js',
  'scripts/material-lab/global.css',
  'scripts/material-lab/postcss.config.js',
  'scripts/material-lab/without-network.js',
  'scripts/material-lab/source-inputs.js',
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
      nativeModulePackageVersion: nativePackage.version,
      nativeModuleArtifact: localPackageSha256
        ? 'local packed Bloom snapshot'
        : 'installed package from consumer lockfile',
      nativeModuleTarballSha256: localPackageSha256,
      lockSha256: createHash('sha256')
        .update(readFileSync(resolve(here, 'bun.lock')))
        .digest('hex'),
      artifactKind: 'Bloom source fixture with the installed native package recorded separately',
      reactCompiler: false,
      dependencies: JSON.parse(readFileSync(resolve(here, 'package.json'), 'utf8')).dependencies,
    },
    null,
    2,
  ),
);
