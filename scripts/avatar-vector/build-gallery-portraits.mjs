import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFile, mkdir } from 'node:fs/promises';
const root = resolve(process.argv[2] ?? new URL('../..', import.meta.url).pathname);
const output = resolve(process.argv[3] ?? `${root}/templates/agents/avatar-portraits.json`);
const load = (file) => import(pathToFileURL(`${root}/src/${file}`).href);
const { CHARACTER_PRESETS, CHARACTER_TEMPLATES } = await load('agent-creator/constants.ts');
const { resolveAvatarCharacter } = await load('agent-avatar/character.ts');
const { composeVectorCharacter } = await load('agent-avatar/vector-compose.ts');
const { vectorAssetLoader } = await load('agent-avatar/vector-assets.ts');
const { renderVectorFrame } = await load('agent-avatar/vector-frame.ts');
const portraits = {};
for (const { id } of CHARACTER_PRESETS) {
  const asset = await composeVectorCharacter(
    resolveAvatarCharacter(CHARACTER_TEMPLATES[id]),
    vectorAssetLoader,
  );
  portraits[id] = renderVectorFrame(asset, { action: 'idle', time: 0 });
}
await mkdir(resolve(output, '..'), { recursive: true });
await writeFile(output, JSON.stringify(portraits));
console.log(`${Object.keys(portraits).length} canonical SVG portraits: ${output}`);
