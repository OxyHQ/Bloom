/** Publication gate: only the SVG renderer and its lazy vector data may ship. */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function assertAvatarVectorsShip(packed, root = process.cwd()) {
  const problems = [];
  const retired =
    /(?:^assets\/character-runtime\/|(?:^|\/)agent-avatar\/(?:NativePortrait|native-adapter|CharacterStillHost|body-pigment|character-runtime-module|character-webview|character-html|character-still-web|character-still|use-character-still|still)(?:\.|\/))/;
  for (const file of packed) {
    if (retired.test(file)) problems.push(`Retired avatar runtime still ships: ${file}`);
    if (file.startsWith('runtime/'))
      problems.push(`Offline avatar extraction source ships: ${file}`);
  }
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  if (
    packageJson.peerDependencies?.['react-native-webview'] ||
    packageJson.peerDependenciesMeta?.['react-native-webview']
  )
    problems.push('Retired avatar WebView peer remains in package metadata');
  if (
    packageJson.peerDependencies?.['@oxy.so/bloom-avatar-native'] ||
    packageJson.peerDependenciesMeta?.['@oxy.so/bloom-avatar-native']
  )
    problems.push('Retired avatar GPU companion peer remains in package metadata');
  if (
    packageJson.files?.includes('assets/character-runtime') ||
    /build:avatar-(?:runtime|native)/.test(packageJson.scripts?.prebuild ?? '')
  )
    problems.push('Retired avatar runtime remains in package build/shipping configuration');
  let manifest;
  try {
    manifest = JSON.parse(
      readFileSync(resolve(root, 'src/agent-avatar/vector-assets/manifest.json'), 'utf8'),
    );
  } catch {
    return [...problems, 'Vector asset manifest missing; run bun run build:avatar-vectors'];
  }
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length)
    return [...problems, 'Invalid vector asset manifest'];
  for (const prefix of [
    'src/agent-avatar/',
    'lib/module/agent-avatar/',
    'lib/commonjs/agent-avatar/',
  ]) {
    const extension = prefix.startsWith('src/') ? 'tsx' : 'js';
    if (!packed.has(`${prefix}VectorCharacterAvatar.${extension}`))
      problems.push(`SVG renderer absent from package: ${prefix}`);
    for (const { file } of manifest.files) {
      if (typeof file !== 'string' || !/^[a-z0-9_-]+\.json$/.test(file)) {
        problems.push(`Invalid vector asset filename: ${String(file)}`);
        continue;
      }
      if (!packed.has(`${prefix}vector-assets/${file}`))
        problems.push(`Vector asset absent from package: ${prefix}vector-assets/${file}`);
    }
    // Packed assets point at shared payloads and are imported through one module each.
    for (const hash of Object.keys(manifest.blobs ?? {}))
      if (!packed.has(`${prefix}vector-assets/blobs/${hash}.json`))
        problems.push(
          `Vector payload absent from package: ${prefix}vector-assets/blobs/${hash}.json`,
        );
    for (const { file, blobs } of manifest.files) {
      if (!blobs || typeof file !== 'string') continue;
      const module = `${prefix}catalog/${file.replace(/\.json$/, '')}.${prefix.startsWith('src/') ? 'ts' : 'js'}`;
      if (!packed.has(module))
        problems.push(`Vector catalog module absent from package: ${module}`);
    }
  }
  return problems;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = new Set();
  for (const prefix of [
    'src/agent-avatar',
    'lib/module/agent-avatar',
    'lib/commonjs/agent-avatar',
  ]) {
    for (const entry of readdirSync(prefix, { recursive: true, withFileTypes: true })) {
      if (entry.isFile())
        files.add(resolve(entry.parentPath, entry.name).slice(process.cwd().length + 1));
    }
  }
  const problems = assertAvatarVectorsShip(files);
  if (problems.length) throw Error(problems.join('\n'));
  console.log('Avatar package: SVG renderer and all lazy assets present; hosted engine excluded');
}
