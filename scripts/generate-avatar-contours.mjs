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
export function sourceFaces() {
  return JSON.parse(
    execFileSync(
      'bun',
      [
        '-e',
        `
    import {FOLD_CONFIG,DEFAULT_CONFIG} from './src/agent-avatar/model';
    import {MIGRATED_CHARACTER_SHAPES} from './src/agent-avatar/character-shapes';
    import {drawFold} from './src/agent-avatar/fold';
    import {DrawingContext} from './src/agent-avatar/drawing';
    import {expressionRig} from './src/agent-avatar/face';
    console.log(JSON.stringify(Object.fromEntries(MIGRATED_CHARACTER_SHAPES.map(([id])=>{
      const blob=['pebble','squircle'].includes(id),c=blob?{...DEFAULT_CONFIG,shape:id}:{...FOLD_CONFIG,foldShape:id,motion:0,idle:false,face:false},morph={started:0,active:false};
      if(!blob)drawFold(new DrawingContext(),c,0,expressionRig(c),[0,0],200,null,0,1,0,morph);
      const g=morph.last, sx=g?.sx??1, x=(g?.faceInset??0)*sx/83,y=-(g?.faceY??0)/83;
      return [id,{centers:[[-c.eyeGap*sx/166+x,y],[c.eyeGap*sx/166+x,y]],radius:Math.min(c.eyeSize*.96/83,c.eyeGap*sx/83*.4)}];
    }))));
  `,
      ],
      { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
    ),
  );
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  fs.writeFileSync(
    new URL(
      '../assets/character-runtime/migrated-contours.mjs',
      import.meta.url,
    ),
    '// Generated from the original Bloom geometry; regenerate with scripts/generate-avatar-contours.mjs.\nexport const MIGRATED_CONTOURS=Object.freeze(' +
      JSON.stringify(sourceContours()) +
      ');\n',
  );
  fs.writeFileSync(
    new URL('../assets/character-runtime/migrated-faces.mjs', import.meta.url),
    '// Generated from shape-owned source face geometry; regenerate with scripts/generate-avatar-contours.mjs.\nexport const MIGRATED_FACES=Object.freeze(' +
      JSON.stringify(sourceFaces()) +
      ');\n',
  );
}
