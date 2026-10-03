/** Export exact existing Bloom contours for direct original-engine recipes. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
export function sourceContours() {
  return JSON.parse(
    execFileSync(
      'bun',
      [
        '-e',
        "import {FOLD_CONFIG,DEFAULT_CONFIG} from './src/agent-avatar/model'; import {legacyRecipe} from './src/agent-avatar/legacy-recipe'; import {MIGRATED_CHARACTER_SHAPES} from './src/agent-avatar/character-shapes'; console.log(JSON.stringify(Object.fromEntries(MIGRATED_CHARACTER_SHAPES.map(([id])=>[id,legacyRecipe(['pebble','squircle'].includes(id)?{...DEFAULT_CONFIG,shape:id}:{...FOLD_CONFIG,foldShape:id}).points]))));",
      ],
      { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
    ),
  );
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1])
  fs.writeFileSync(
    new URL(
      '../assets/character-runtime/migrated-contours.mjs',
      import.meta.url,
    ),
    '// Generated from the original Bloom geometry; regenerate with scripts/generate-avatar-contours.mjs.\nexport const MIGRATED_CONTOURS=Object.freeze(' +
      JSON.stringify(sourceContours()) +
      ');\n',
  );
