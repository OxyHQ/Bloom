/** Publication gate for the sole avatar runtime and all of its lazy assets. */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export function assertAvatarRuntimeShips(packed, root = process.cwd()) {
  const prefix = 'assets/character-runtime/';
  const problems = [];
  const retired =
    /(?:^|\/)agent-avatar\/(?:ProceduralAvatar|SvgDrawing|AgentFace|artwork|drawing|face|fold|shape-morph|legacy-contours)(?:\.|\/)/;
  for (const file of packed)
    if (retired.test(file)) problems.push(`Retired avatar implementation still ships: ${file}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolve(root, prefix, 'manifest.json'), 'utf8'));
  } catch {
    return ['Avatar runtime manifest missing; run bun run build:avatar-runtime'];
  }
  if (
    manifest.version !== 1 ||
    manifest.entry !== 'runtime.mjs' ||
    !manifest.files?.['runtime.mjs']
  )
    return ['Invalid avatar runtime manifest'];
  const expected = new Set(['README.md', 'manifest.json', ...Object.keys(manifest.files)]);
  const actual = readdirSync(resolve(root, prefix), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => resolve(entry.parentPath, entry.name).slice(resolve(root, prefix).length + 1));
  for (const file of actual) {
    if (!expected.has(file)) problems.push(`Unexpected avatar runtime file: ${file}`);
    if (/\.(wasm|data)$/.test(file)) problems.push(`Obsolete avatar executable: ${file}`);
  }
  for (const file of expected) {
    if (!packed.has(prefix + file))
      problems.push(`Avatar runtime file absent from package: ${file}`);
    if (!actual.includes(file)) {
      problems.push(`Missing avatar runtime file: ${file}`);
      continue;
    }
    if (manifest.files[file]) {
      const content = readFileSync(resolve(root, prefix, file));
      if (createHash('sha256').update(content).digest('hex') !== manifest.files[file])
        problems.push(`Avatar runtime integrity mismatch: ${file}`);
      if (
        file.endsWith('.mjs') &&
        /orbit-characters|legacy-engine|ProceduralAvatar|SvgDrawing/.test(content.toString())
      )
        problems.push(`Obsolete avatar engine in bundle: ${file}`);
    }
  }
  return problems;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const prefix = 'assets/character-runtime/';
  const files = new Set(
    readdirSync(prefix, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => resolve(entry.parentPath, entry.name).slice(process.cwd().length + 1)),
  );
  const problems = assertAvatarRuntimeShips(files);
  if (problems.length) throw Error(problems.join('\n'));
  console.log('Avatar runtime: one engine, complete assets, all hashes verified');
}
