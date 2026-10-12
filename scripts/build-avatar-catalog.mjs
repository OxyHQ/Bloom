/** Build-only translation of validated original meshes and named material observations. */
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root = 'runtime/avatar/assets';
const base = JSON.parse(await readFile(`${root}/reference-pose.json`, 'utf8'));
const presets = [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const named = (values, template) => {
  let offset = 0;
  const result = Object.fromEntries(
    Object.entries(template).map(([name, example]) => {
      const value = values.slice(offset, offset + example.length);
      offset += example.length;
      return [name, value];
    }),
  );
  assert.equal(offset, values.length);
  return result;
};
for (const preset of presets) {
  const input =
    preset === 'blue_beret'
      ? '.local/avatar-source-inventory/materials'
      : `.local/avatar-original-materials/${preset}`;
  const destination = `${root}/${preset}`;
  await mkdir(destination, { recursive: true });
  const geometry = JSON.parse(
    await readFile(`.local/avatar-original-geometry/${preset}/geometry.json`, 'utf8'),
  );
  const bytes = await readFile(`.local/avatar-original-geometry/${preset}/geometry.bin`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), geometry.buffer.sha256);
  const state = JSON.parse(await readFile(`${input}/state.json`, 'utf8'));
  const draws = state.draws.filter((d) => d.defines.some((s) => s.includes('FELIPE_MATERIAL')));
  const surfaces = draws.filter((d) => d.method === 'drawElements');
  const fur = draws.filter((d) => d.method === 'drawArraysInstanced');
  assert.equal(surfaces.length, geometry.parts.length, `${preset}: surface count`);
  assert.equal(
    fur.length,
    geometry.parts.filter((part) => part.fur).length,
    `${preset}: fur count`,
  );
  const parts = geometry.parts.map((part, i) => {
    const draw = surfaces[i];
    assert.equal(
      draw.args[1],
      part.indices.reduce((sum, range) => sum + range.count, 0),
      `${preset} part ${i}: index count`,
    );
    const kind = Number(draw.defines[0].match(/FELIPE_KIND (\d+)/)[1]);
    return {
      id: part.id,
      materialKind: kind,
      fields: named(draw.uniformBlocks.DrawBlock, base.parts[0]),
      label: part.material.label,
      attachment: part.pose.attachmentLabel,
      fur: Boolean(part.fur),
    };
  });
  for (const texture of base.sourceTextures) {
    const source = state.textures.find((t) => t.id === surfaces[0].samplers[texture.name]);
    assert.equal(source.sha256, texture.sha256, `${preset}: shared ${texture.name}`);
  }
  const copy = state.canvasCopies.findLast(
    (c) => c.destinationCss.width === 320 && c.args.length === 8,
  );
  assert(copy, `${preset}: visible presentation crop`);
  const [sx, sy, sw, sh, dx, dy, dw, dh] = copy.args;
  const crop = [(sx - (dx * sw) / dw) / 320, (sy - (dy * sh) / dh) / 320, sw / dw, sh / dh];
  const material = {
    preset,
    crop,
    frame: named(surfaces[0].uniformBlocks.FrameBlock, base.frame),
    parts,
    copy,
    limitation: 'Captured neutral pose and materials; not a complete animation controller.',
  };
  const furParts = parts.filter((part) => part.fur);
  fur.forEach((draw, i) =>
    assert.deepEqual(
      named(draw.uniformBlocks.DrawBlock, base.parts[0]),
      furParts[i].fields,
      `${preset}: fur attaches to its source surface`,
    ),
  );
  await writeFile(`${destination}/material.json`, JSON.stringify(material, null, 2));
  await writeFile(`${destination}/geometry.bin`, bytes);
  await copyFile(
    `.local/avatar-original-geometry/${preset}/geometry.json`,
    `${destination}/geometry.json`,
  );
  await copyFile(`${input}/blue-beret-original.png`, `${destination}/reference.png`);
  console.log(`${preset}: ${parts.length} surfaces, ${fur.length} coats, validated shared maps`);
}
await writeFile(`${root}/catalog.json`, JSON.stringify({ version: 1, presets }, null, 2));
