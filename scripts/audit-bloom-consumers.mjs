#!/usr/bin/env node
/** Read-only source/install census. Never installs packages or changes a checkout. */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';

const args = process.argv.slice(2);
const root = resolve(args.find((arg) => !arg.startsWith('--')) ?? '..');
const fetch = args.includes('--fetch');
const output = args.find((arg) => arg.startsWith('--output='))?.slice(9);
function git(directory, ...args) {
  try {
    return execFileSync('git', ['-C', directory, ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: 45000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd();
  } catch {
    return null;
  }
}
function installed(directory) {
  // Resolve independently for each workspace, including hoisted Bun links.
  let current = directory;
  while (true) {
    const manifest = join(current, 'node_modules/@oxy.so/bloom/package.json');
    if (existsSync(manifest)) {
      try {
        return {
          version: JSON.parse(readFileSync(manifest, 'utf8')).version,
          packagePath: relative(root, realpathSync(dirname(manifest))),
        };
      } catch {
        return { status: 'unreadable' };
      }
    }
    const parent = dirname(current);
    if (parent === current) return { status: 'not installed' };
    current = parent;
  }
}
const repositories = [];
const skipped = [];
for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
  const directory = join(root, entry.name);
  if (!existsSync(join(directory, '.git'))) continue;
  if (['GWJ', 'Bloom'].includes(entry.name)) {
    skipped.push({
      repository: entry.name,
      reason:
        entry.name === 'GWJ'
          ? 'Project rules exclude Oxy UI adoption'
          : 'Library under audit, not a consumer',
    });
    continue;
  }
  const defaultRef = git(directory, 'symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD');
  if (!defaultRef) {
    skipped.push({
      repository: entry.name,
      reason: 'No origin default-branch ref; requires explicit review',
    });
    continue;
  }
  let sha = git(directory, 'rev-parse', defaultRef);
  let paths = git(directory, 'ls-tree', '-r', '--name-only', sha)?.split('\n') ?? [];
  let manifests = paths.filter(
    (path) =>
      /(^|\/)package\.json$/.test(path) && !/(^|\/)(node_modules|vendor|\.worktrees)\//.test(path),
  );
  const hasBloom = manifests.some((path) =>
    /"@oxy\.so\/bloom"\s*:/.test(git(directory, 'show', `${sha}:${path}`) ?? ''),
  );
  const imports =
    git(
      directory,
      'grep',
      '-l',
      '-F',
      '@oxy.so/bloom',
      sha,
      '--',
      '*.ts',
      '*.tsx',
      '*.js',
      '*.jsx',
    ) ?? '';
  if (!hasBloom && !imports) continue;
  const fetched = fetch ? git(directory, 'fetch', '--quiet', 'origin') !== null : false;
  sha = git(directory, 'rev-parse', defaultRef);
  paths = git(directory, 'ls-tree', '-r', '--name-only', sha)?.split('\n') ?? [];
  manifests = paths.filter(
    (path) =>
      /(^|\/)package\.json$/.test(path) && !/(^|\/)(node_modules|vendor|\.worktrees)\//.test(path),
  );
  const packages = [];
  const historicalManifests = manifests.filter((path) => /(^|\/)docs\/audits\//.test(path));
  manifests = manifests.filter((path) => !historicalManifests.includes(path));
  const rootManifest = JSON.parse(git(directory, 'show', `${sha}:package.json`) ?? '{}');
  const catalogs = rootManifest.workspaces?.catalog ?? rootManifest.catalog ?? {};
  for (const path of manifests) {
    let manifest;
    try {
      manifest = JSON.parse(git(directory, 'show', `${sha}:${path}`));
    } catch {
      continue;
    }
    const declarations = Object.fromEntries(
      ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].flatMap(
        (kind) =>
          manifest[kind]?.['@oxy.so/bloom'] ? [[kind, manifest[kind]['@oxy.so/bloom']]] : [],
      ),
    );
    if (!Object.keys(declarations).length) continue;
    const localManifestPath = join(directory, path);
    let localDeclaration = null;
    try {
      const local = JSON.parse(readFileSync(localManifestPath, 'utf8'));
      localDeclaration = Object.fromEntries(
        Object.keys(declarations).map((kind) => [kind, local[kind]?.['@oxy.so/bloom'] ?? null]),
      );
    } catch {}
    packages.push({
      manifest: path,
      name: manifest.name ?? null,
      declarations,
      catalog: Object.values(declarations).includes('catalog:')
        ? (catalogs['@oxy.so/bloom'] ?? 'unresolved')
        : null,
      installed: installed(dirname(localManifestPath)),
      localDeclaration,
    });
  }
  const locks = [];
  for (const path of paths.filter(
    (path) =>
      /(^|\/)(bun\.lock|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/.test(path) &&
      !/(^|\/)(node_modules|vendor|\.worktrees)\//.test(path),
  )) {
    if (path.endsWith('.lockb')) {
      locks.push({ path, status: 'binary lock: not decoded' });
      continue;
    }
    const content = git(directory, 'show', `${sha}:${path}`) ?? '';
    const matches = [
      ...content.matchAll(/@oxy\.so\/bloom(?:@|\/)(\d+\.\d+\.\d+(?:-[\w.-]+)?)/g),
    ].map((match) => match[1]);
    const versions = [...new Set(matches)].sort();
    locks.push({
      path,
      versions,
      status: versions.length
        ? 'text locator evidence; per-workspace resolution not inferred'
        : 'no text locator resolved',
    });
  }
  const sourceImports = (
    git(
      directory,
      'grep',
      '-l',
      '-F',
      '@oxy.so/bloom',
      sha,
      '--',
      '*.ts',
      '*.tsx',
      '*.js',
      '*.jsx',
    ) ?? ''
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(sha.length + 1));
  const ownershipCandidates = sourceImports.filter(
    (path) =>
      /(shell|screen|layout|composer|header|map|panel|provider)/i.test(path) &&
      !/(test|stories|fixture|docs\/audits)/i.test(path),
  );
  repositories.push({
    repository: entry.name,
    ref: defaultRef.replace('refs/remotes/', ''),
    sha,
    fetch: fetched
      ? 'succeeded'
      : fetch
        ? 'failed; ref may be stale'
        : 'not requested; ref may be stale',
    checkoutSha: git(directory, 'rev-parse', 'HEAD'),
    checkoutDirtyEntries: (git(directory, 'status', '--porcelain') ?? '')
      .split('\n')
      .filter(Boolean).length,
    packages,
    locks,
    importFileCount: sourceImports.length,
    ownershipCandidates,
    adoption: 'not verified: source candidates require route ancestry and runtime review',
    web: 'not run',
    ios: 'not run',
    android: 'not run',
    distributedBinary: 'unknown',
  });
}
const result = {
  schemaVersion: 1,
  observedAt: new Date().toISOString(),
  scope:
    'Immediate git checkouts under supplied workspace root; default remote refs for source and local filesystem for installed packages. Nested repositories, remote-only repositories and non-literal imports need separate review. Activity is not inferred from dependency presence.',
  repositories,
  skipped,
};
const json = `${JSON.stringify(result, null, 2)}\n`;
if (output) writeFileSync(output, json);
else process.stdout.write(json);
