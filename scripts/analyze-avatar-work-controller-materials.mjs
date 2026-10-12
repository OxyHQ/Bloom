/** Named semantic field evidence for Work outro. No fitted animation is emitted. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const preset = process.env.AVATAR_PRESET || 'alfred',
  root = process.env.AVATAR_WORK_CONTROLLER_OUTPUT || `.local/avatar-work-controller/${preset}`;
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const geometry = await read(`.local/avatar-original-geometry/${preset}/geometry.json`);
const baseHashes = new Set(
  geometry.parts.flatMap((p) => [p.vertices.sha256, ...(p.fur ? [p.fur.sha256] : [])]),
);
const names = [
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
const cases = [],
  loaded = [];
for (const name of ['cycles1', 'cycles2', 'stop0_5', 'stop1_2', 'stop3_4', 'interrupt1_2']) {
  let raw;
  try {
    raw = await read(
      name === 'cycles1'
        ? `.local/avatar-computer-source/${preset}/work-raw.json`
        : `${root}/${name}/work-raw.json`,
    );
  } catch (e) {
    if (e.code === 'ENOENT') continue;
    throw e;
  }
  const stop = raw.calls.find(
    (c) => c.method === 'applyActivity' && c.args[0].command === 2,
  ).renderTime;
  const buffers = new Map(raw.vertexBuffers.map((b) => [b.id, b.sha256])),
    parts = new Map();
  const frames = raw.frames.filter(
    (f) => f.renderTime >= stop && f.renderTime <= stop + 1.05 + 1e-9,
  );
  for (const frame of frames)
    for (const draw of frame.draws) {
      const id = draw.vertexAttributes.find((a) => a.name === 'position').bufferId,
        hash = buffers.get(id);
      assert(hash);
      if (baseHashes.has(hash)) continue;
      let part = parts.get(id);
      if (!part) {
        part = {
          id,
          geometrySha256: hash,
          referenceKind: draw.blocks.DrawBlock[43],
          first: frame.renderTime - stop,
          last: frame.renderTime - stop,
          fields: {},
          initial: draw.blocks.DrawBlock,
        };
        parts.set(id, part);
      }
      part.last = frame.renderTime - stop;
      for (let k = 0; k < names.length; k++) {
        const current = draw.blocks.DrawBlock.slice(32 + k * 4, 36 + k * 4),
          initial = part.initial.slice(32 + k * 4, 36 + k * 4),
          delta = Math.max(...current.map((v, j) => Math.abs(v - initial[j])));
        if (delta || part.fields[names[k]])
          part.fields[names[k]] = {
            initial,
            last: current,
            maxAbsoluteDelta: Math.max(delta, part.fields[names[k]]?.maxAbsoluteDelta || 0),
          };
      }
    }
  cases.push({
    name,
    stop,
    parts: [...parts.values()].map(({ initial, ...part }) => part),
  });
  loaded.push({
    name,
    stop,
    frames,
    frameBase: raw.frames[0].draws[0].blocks.FrameBlock,
  });
}
const selectors = {
  camera: (f) => f.draws[0].blocks.FrameBlock,
  bodyX: (f) => [f.draws[0].blocks.DrawBlock[12]],
  keyboardReference: (f) =>
    f.draws.find((d) => d.blocks.DrawBlock[43] === -4)?.blocks.DrawBlock.slice(40, 44),
  keyboardCoverage: (f) =>
    f.draws.find((d) => d.blocks.DrawBlock[43] === -4)?.blocks.DrawBlock.slice(48, 52),
  screenReferenceX: (f) => {
    const d = f.draws.find((d) => d.blocks.DrawBlock[43] === -24);
    return d ? [d.blocks.DrawBlock[40]] : undefined;
  },
};
const comparisons = [],
  base = loaded[0];
for (const item of loaded.slice(1)) {
  const byTime = new Map(item.frames.map((f) => [Math.round((f.renderTime - item.stop) * 60), f]));
  const channels = {};
  for (const [name, select] of Object.entries(selectors)) {
    let count = 0,
      max = 0,
      different = 0;
    for (const frame of base.frames) {
      const other = byTime.get(Math.round((frame.renderTime - base.stop) * 60));
      if (!other) continue;
      const a = select(frame),
        b = select(other);
      if (!a || !b) continue;
      assert.equal(a.length, b.length);
      for (let k = 0; k < a.length; k++) {
        const delta = Math.abs(a[k] - b[k]);
        max = Math.max(max, delta);
        different += delta !== 0 ? 1 : 0;
        count++;
      }
    }
    channels[name] = { count, different, max };
  }
  comparisons.push({ reference: base.name, case: item.name, channels });
}
const sharedChannels = {};
for (const name of ['camera', 'keyboardReference', 'keyboardCoverage', 'screenReferenceX']) {
  assert(
    comparisons.every((comparison) => comparison.channels[name].max === 0),
    `${name}: not proven identical across Stops`,
  );
  const samples = base.frames.flatMap((frame) => {
    let value = selectors[name](frame);
    if (!value) return [];
    if (name === 'camera')
      value = [
        value[0] / base.frameBase[0],
        value[5] / base.frameBase[5],
        (value[13] - base.frameBase[13]) / base.frameBase[5],
      ];
    return [{ time: frame.renderTime - base.stop, value }];
  });
  sharedChannels[name] = {
    samples,
    observedCases: loaded.map((item) => item.name),
  };
}
await writeFile(
  `${root}/outro-channels.json`,
  JSON.stringify(
    {
      schema: 'bloom.avatar.observed-work-outro-channels',
      version: 1,
      preset,
      source:
        'Original semantic channels identical at fixed60 across the named observations. This is a partial controller, not a complete Work or arbitrary-Stop implementation.',
      channels: sharedChannels,
    },
    null,
    2,
  ),
);
const report = {
  preset,
  limitations: [
    'Only named channels listed in comparisons are tested reusable across these observed Stops. Differing channels are preserved in raw captures; no fitted blend is promoted.',
    'Exact matching material clocks do not establish a repeated Work loop or arbitrary-phase transform reconstruction.',
  ],
  cases,
  comparisons,
};
await writeFile(`${root}/material-outro.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(comparisons, null, 2));
