/** Build review-only, synchronized pixel/pose fixtures. Never a runtime motion catalog. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const preset = process.env.AVATAR_PRESET || 'lime_frog';
assert(/^[a-z0-9_]+$/.test(preset));
const input = process.env.AVATAR_MOTION_SOURCE || `.local/avatar-runtime-motion-review/${preset}`;
const observed = JSON.parse(
  await readFile(`.local/avatar-motion-observations-review/${preset}.json`, 'utf8'),
);
assert.equal(observed.schema, 'bloom.avatar.motion-observations');
const output = `.local/avatar-motion-review/${preset}`;
await mkdir(output, { recursive: true });
const material = JSON.parse(
  await readFile(`runtime/avatar/assets/${preset}/material.json`, 'utf8'),
);
const geometry = JSON.parse(
  await readFile(`runtime/avatar/assets/${preset}/geometry.json`, 'utf8'),
);
const named = (array, template) => {
  let offset = 0;
  const fields = Object.fromEntries(
    Object.entries(template).map(([key, value]) => {
      const field = array.slice(offset, offset + value.length);
      offset += value.length;
      return [key, field];
    }),
  );
  assert.equal(offset, array.length);
  return fields;
};
const hashes = new Map(
  geometry.parts.flatMap((p) => [
    [p.vertices.sha256, `mesh:${p.id}`],
    ...(p.fur ? [[p.fur.sha256, `fur:${p.id}`]] : []),
  ]),
);
for (const [name, clip] of Object.entries(observed.observations)) {
  assert.equal(clip.loop, false);
  assert.equal(clip.endSemantics, 'observation-boundary');
  const raw = JSON.parse(await readFile(`${input}/${name}-raw.json`, 'utf8'));
  assert(
    raw.checkpoints?.length && raw.initialCopy,
    'Synchronized pixels and original crop are required; recapture old observations',
  );
  const bufferIds = new Map(raw.vertexBuffers.map((b) => [b.id, hashes.get(b.sha256)]));
  const byId = new Map(
    raw.frames[0].draws.map((d) => [
      bufferIds.get(d.vertexAttributes.find((a) => a.name === 'position').bufferId),
      d,
    ]),
  );
  const fixture = structuredClone(material);
  fixture.frame = named(raw.frames[0].draws[0].blocks.FrameBlock, material.frame);
  // This review renderer has one fixed camera/light setup. Reject changes rather than silently omitting them.
  for (const frame of raw.frames)
    for (const draw of frame.draws)
      assert.deepEqual(
        draw.blocks.FrameBlock,
        raw.frames[0].draws[0].blocks.FrameBlock,
        `${name}: animated camera/light fields need explicit support`,
      );
  for (const part of fixture.parts) {
    part.fields = named(byId.get(`mesh:${part.id}`).blocks.DrawBlock, part.fields);
    if (part.fur)
      assert.deepEqual(
        byId.get(`fur:${part.id}`).blocks.DrawBlock,
        byId.get(`mesh:${part.id}`).blocks.DrawBlock,
      );
  }
  const copy = raw.initialCopy;
  assert.equal(copy.args.length, 8);
  const [sx, sy, sw, sh, dx, dy, dw, dh] = copy.args;
  fixture.crop = [
    (sx - (dx * sw) / dw) / copy.width,
    (sy - (dy * sh) / dh) / copy.height,
    sw / dw,
    sh / dh,
  ];
  const checkpoints = [];
  for (const point of raw.checkpoints) {
    const image = `${name}-${point.requested}s.png`;
    await copyFile(`${input}/${image}`, `${output}/${image}`);
    checkpoints.push({
      time: point.renderTime - raw.frames[0].renderTime,
      requested: point.requested,
      frameIndex: point.frameIndex,
      image: `/.local/avatar-motion-review/${preset}/${image}`,
    });
  }
  await writeFile(
    `${output}/${name}.json`,
    JSON.stringify({
      schema: 'bloom.avatar.observation-review',
      preset,
      name,
      clip,
      material: fixture,
      checkpoints,
      limitation:
        'Finite observed motion, not a complete looping or interruptible action controller.',
    }),
  );
  console.log(
    `${preset}/${name}: ${clip.times.length} poses, ${checkpoints.length} synchronized PNG references`,
  );
}
