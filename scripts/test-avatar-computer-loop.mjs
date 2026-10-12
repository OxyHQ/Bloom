import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const temporary = '.local/computer-loop-test';
await mkdir(temporary, { recursive: true });
for (const file of ['computer-loop', 'breathing', 'motion']) {
  const text = ts
    .transpileModule(await readFile(`runtime/avatar/${file}.ts`, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    })
    .outputText.replaceAll("'./breathing'", "'./breathing.mjs'")
    .replaceAll("'./motion'", "'./motion.mjs'");
  await writeFile(`${temporary}/${file}.mjs`, text);
}
const { ComputerLoopSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/computer-loop.mjs`)
);
for (const preset of (
  process.env.AVATAR_LOOP_PRESETS ||
  'alfred,blue_beret,purple_heart,lime_frog,coral_monocle,gus,blue_spectacles,lime_headphones'
).split(','))
  test(`${preset}: complete Computer loop repeats every native part with independent body and shadows`, async () => {
    const motion = JSON.parse(
      await readFile(`.local/avatar-loop-assets/${preset}/computer-motion.json`),
    );
    const raw = JSON.parse(
      await readFile(`.local/avatar-work-controller/${preset}/cycles6/work-raw.json`),
    );
    const geometry = JSON.parse(
      await readFile(`.local/avatar-loop-assets/${preset}/computer-geometry.json`),
    );
    const byHash = new Map(
      geometry.parts.flatMap((p) => [
        [p.vertices.sha256, `mesh:${p.id}`],
        ...(p.fur ? [[p.fur.sha256, `fur:${p.id}`]] : []),
      ]),
    );
    const physicalHashes = new Map(raw.vertexBuffers.map((b) => [b.id, b.sha256]));
    const ids = new Map();
    let nextId = geometry.baseMeshCount;
    for (const frame of raw.frames)
      for (const draw of frame.draws) {
        const id = draw.vertexAttributes.find((a) => a.name === 'position').bufferId;
        if (!ids.has(id)) {
          const match = byHash.get(physicalHashes.get(id));
          ids.set(
            id,
            match?.startsWith('fur:') || Number(match?.split(':')[1]) < geometry.baseMeshCount
              ? match
              : `mesh:${nextId++}`,
          );
        }
      }
    const sampler = new ComputerLoopSampler(motion.clip, 3),
      pose = sampler.createPose();
    let worldMax = 0,
      normalRelativeMax = 0,
      materialMax = 0,
      frames = 0;
    for (const frame of raw.frames.filter((f) => f.renderTime >= 10 && f.renderTime < 16)) {
      sampler.sample(frame.renderTime - 3, pose);
      frames++;
      const draws = new Map(
        frame.draws.map((d) => [
          ids.get(d.vertexAttributes.find((a) => a.name === 'position').bufferId),
          d,
        ]),
      );
      for (const part of pose) {
        const draw = draws.get(part.id);
        assert.equal(
          part.fields.camera[3],
          draw ? 1 : 0,
          `${frame.renderTime}/${part.id} visibility`,
        );
        if (!draw) continue;
        const block = draw.blocks.DrawBlock;
        for (let k = 0; k < 16; k++) {
          worldMax = Math.max(worldMax, Math.abs(part.world.elements[k] - block[k]));
          normalRelativeMax = Math.max(
            normalRelativeMax,
            Math.abs(part.normalMatrix.elements[k] - block[16 + k]) /
              Math.max(1, ...block.slice(16, 32).map(Math.abs)),
          );
        }
        const fields = [
          'colorRoughness',
          'parameters',
          'referencePose',
          'emissiveMetallic',
          'coverage',
          'eyeCurveOriginAmount',
          'eyeCurveRightWidth',
          'eyeCurveUp',
          'paletteBounds',
          'paletteClosure',
          'paletteReference',
          'fur',
          'furEye0',
          'furEye1',
          'signatureDeform',
        ];
        for (let k = 0; k < fields.length; k++)
          for (let j = 0; j < 4; j++)
            materialMax = Math.max(
              materialMax,
              Math.abs(part.fields[fields[k]][j] - block[32 + k * 4 + j]),
            );
      }
    }
    const report = { preset, frames, worldMax, normalRelativeMax, materialMax };
    console.log(JSON.stringify(report));
    assert.equal(frames, 360);
    assert.equal(materialMax, 0);
    assert(worldMax < 5e-7);
    assert(normalRelativeMax < 5e-7);
  });
