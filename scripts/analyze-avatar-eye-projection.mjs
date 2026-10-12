import fs from 'node:fs';
import * as T from 'three';
const root =
  process.env.AVATAR_GAZE_SOURCE || '.local/avatar-pointer-validation';
const presets = (
  process.env.AVATAR_GAZE_PRESETS || 'lime_frog,blue_spectacles,lime_headphones'
).split(',');
const invsmooth = (v) =>
  0.5 - Math.sin(Math.asin(1 - 2 * Math.min(1, Math.max(0, v))) / 3);
const smooth = (v) => v * v * (3 - 2 * v);
for (const preset of presets) {
  const blinkBase = JSON.parse(
    fs.readFileSync(`${root}/lime_frog/idle-raw.json`),
  );
  const base = JSON.parse(fs.readFileSync(`${root}/${preset}/idle-raw.json`));
  const geometry = JSON.parse(
    fs.readFileSync(
      `runtime/avatar/assets/${preset}/geometry-low.json`,
    ),
  );
  const mat = (d, offset = 0) =>
    new T.Matrix4().fromArray(d.blocks.DrawBlock.slice(offset, offset + 16));
  const profiles = geometry.parts
    .filter((p) =>
      preset === 'lime_headphones'
        ? p.id === 1 || p.id === 2
        : preset === 'coral_monocle'
          ? p.id === 3 || p.id === 4
          : p.id >= 1 && p.id <= 4,
    )
    .map((p) => {
      const b = Buffer.from(p.unresolvedMaterialAndPosePrefixHex, 'hex'),
        at = 116 + b.readUInt32LE(112) + 36;
      return {
        id: p.id,
        anchor: p.pose.deformationCenter,
        half: [b.readFloatLE(at + 2), b.readFloatLE(at + 6)],
      };
    });
  for (const name of (process.env.AVATAR_GAZE_NAME || 'pointer').split(',')) {
    const frames = JSON.parse(
      fs.readFileSync(`${root}/${preset}/${name}-raw.json`),
    );
    let x = 0,
      y = 0,
      vx = 0,
      vy = 0,
      tx = 0,
      ty = 0,
      last = 0;
    const result = { preset, name, worldMax: 0, normalMax: 0, worst: null };
    for (let k = 0; k < frames.length; k++) {
      const a = frames[k],
        b = base[k];
      const bodyDelta = mat(a.draws[0]).multiply(mat(b.draws[0]).invert());
      const normalDelta = mat(a.draws[0], 16).multiply(
        mat(b.draws[0], 16).invert(),
      );
      for (const p of profiles) {
        const params = (
          preset === 'lime_headphones' ? blinkBase[k].draws[1] : b.draws[p.id]
        ).blocks.DrawBlock.slice(36, 40);
        const blink =
          preset === 'coral_monocle'
            ? params[3] > 0
              ? (1 + params[3]) / 2
              : params[2] / 2
            : params[3] > 0
              ? (1 + invsmooth(params[3])) / 2
              : invsmooth(params[2]) / 2;
        const openness =
          1 -
          smooth(preset === 'coral_monocle' ? Math.min(1, 6 * blink) : blink);
        const yaw =
            x *
            (preset === 'coral_monocle'
              ? 0
              : preset === 'lime_headphones'
                ? 0.238
                : 0.042) *
            openness,
          pitch =
            y *
            (preset === 'coral_monocle'
              ? 0
              : preset === 'lime_headphones'
                ? 0.112
                : 0.028) *
            openness;
        const cx = Math.cos(yaw),
          sx = Math.sin(yaw),
          cy = Math.cos(pitch),
          sy = Math.sin(pitch);
        const ox =
            x *
            p.half[0] *
            (preset === 'coral_monocle'
              ? 0.098
              : preset === 'lime_headphones'
                ? 0.252
                : 0.07) *
            openness,
          oy =
            -y *
            p.half[1] *
            (preset === 'coral_monocle'
              ? 0.035
              : preset === 'lime_headphones'
                ? 0.14
                : 0.042) *
            openness;
        const [px, py, pz] = p.anchor;
        const c = new T.Matrix4().set(
          cx,
          sx * sy,
          sx * cy,
          px * (1 - cx) - py * sx * sy - pz * sx * cy + ox,
          0,
          cy,
          -sy,
          py * (1 - cy) + pz * sy + oy,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
        );
        const expected = bodyDelta
          .clone()
          .multiply(mat(b.draws[p.id]))
          .multiply(c);
        const expectedN = normalDelta
          .clone()
          .multiply(mat(b.draws[p.id], 16))
          .multiply(c.clone().setPosition(0, 0, 0).invert().transpose());
        for (let j = 0; j < 16; j++) {
          let e = Math.abs(
            expected.elements[j] - a.draws[p.id].blocks.DrawBlock[j],
          );
          if (e > result.worldMax) {
            result.worldMax = e;
            result.worst = {
              time: a.time,
              id: p.id,
              j,
              x,
              y,
              blink,
              openness,
              yaw,
              pitch,
              actual: a.draws[p.id].blocks.DrawBlock[j],
              expected: expected.elements[j],
            };
          }
          result.normalMax = Math.max(
            result.normalMax,
            Math.abs(
              expectedN.elements[j] - a.draws[p.id].blocks.DrawBlock[16 + j],
            ),
          );
        }
      }
      let dt = a.time - last;
      last = a.time;
      const decay = Math.exp(-55 * dt),
        dx = x - tx,
        dy = y - ty,
        jx = vx + 55 * dx,
        jy = vy + 55 * dy;
      x = tx + (dx + jx * dt) * decay;
      y = ty + (dy + jy * dt) * decay;
      vx = (vx - 55 * jx * dt) * decay;
      vy = (vy - 55 * jy * dt) * decay;
      for (const e of a.events)
        if (e.x !== undefined && e.kind.startsWith('pointer')) {
          tx = Math.fround(e.x) - 0.5;
          ty = Math.fround(e.y) - 0.5;
        }
    }
    console.log(JSON.stringify(result));
  }
}
