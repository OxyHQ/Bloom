/** Converts offline observations to explicit semantic poses for Node/browser gates. */
import { readFile } from 'node:fs/promises';
import { Matrix4, Vector3, Quaternion } from 'three';
import { ReactionCancellationPose } from '../runtime/avatar/reaction-cancel.ts';
import { AvatarPointerController } from '../runtime/avatar/pointer-controller.ts';
import { AvatarGazeController } from '../runtime/avatar/gaze-controller.ts';
import {
  AvatarEyeGazeController,
  eyeClosureFromMorph,
} from '../runtime/avatar/eye-gaze-controller.ts';
import { ReactionGazeComposer } from '../runtime/avatar/reaction-gaze.ts';
export const CANCEL_PRESETS = [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
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
const smooth = (v) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * t * (10 - 15 * t + 6 * t * t);
};
export async function reactionCancellationFixtures(preset, scenario = 'core') {
  const coreSeconds = {
    alfred: 2.2,
    purple_heart: 2.4,
    lime_frog: 2.5,
    coral_monocle: 2.5,
    gus: 2.6,
    blue_spectacles: 2.6,
    lime_headphones: 2.1,
  }[preset];
  const command = scenario.startsWith('entry')
    ? 0.6
    : scenario === 'exit'
      ? coreSeconds + 0.6
      : 1.1;
  const frozenIndex = Math.round(command * 30);
  const firstIndex = frozenIndex + 1;
  const [active, baseline, idle, geometry, material, allProfiles] =
    await Promise.all([
      read(
        scenario === 'core'
          ? `.local/avatar-reaction-pointer/${preset}/interrupt/reaction-drag-raw.json`
          : scenario === 'entry-gaze'
            ? `.local/avatar-reaction-pointer/${preset}/entry-gaze/entry-gaze-raw.json`
            : `.local/avatar-reaction-pointer/${preset}/entry-exit/${scenario}-drag-raw.json`,
      ),
      read(`.local/avatar-eye-activities/${preset}/reaction-baseline-raw.json`),
      read(`.local/avatar-pointer-validation/${preset}/idle-raw.json`),
      read(`runtime/avatar/assets/${preset}/geometry-low.json`),
      read(`runtime/avatar/assets/${preset}/material.json`),
      read('runtime/avatar/assets/eye-gaze-profiles.json'),
    ]);
  const descriptions = [
    ...material.parts.map((p) => ({ ...p, isFur: false })),
    ...material.parts.filter((p) => p.fur).map((p) => ({ ...p, isFur: true })),
  ];
  const pose = (frame) =>
    frame.draws.map((d, i) => ({
      id: `${descriptions[i].isFur ? 'fur' : 'mesh'}:${descriptions[i].id}`,
      world: new Matrix4().fromArray(d.blocks.DrawBlock),
      normalMatrix: new Matrix4().fromArray(d.blocks.DrawBlock.slice(16, 32)),
      fields: Object.fromEntries(
        fields.map((name, j) => [
          name,
          d.blocks.DrawBlock.slice(32 + j * 4, 36 + j * 4),
        ]),
      ),
    }));
  const frozen = pose(baseline[frozenIndex]);
  let neutral;
  if (scenario !== 'core') {
    const strength = scenario.startsWith('entry')
      ? 1 - smooth((command - (0.5 + 1 / 30)) / 0.18)
      : smooth((command - (0.5 + 1 / 30 + coreSeconds)) / 0.18);
    const b =
      idle[scenario.startsWith('entry') ? 15 : frozenIndex].draws[0].blocks
        .DrawBlock;
    const v = new Vector3();
    new Matrix4().fromArray(b).decompose(new Vector3(), new Quaternion(), v);
    neutral = {
      translation: b.slice(12, 15).map((x) => x * strength),
      scale: v.toArray().map((x) => 1 + (x - 1) * strength),
    };
  }
  const model = new ReactionCancellationPose(
    frozen,
    {
      groundY: geometry.parts.find((p) => p.id === 0).bounds.min[1],
      pivots: Object.fromEntries(
        geometry.parts.map((p) => [p.id, p.pose.deformationCenter]),
      ),
    },
    neutral,
  );
  const pointer = new AvatarPointerController(),
    gaze = new AvatarGazeController(),
    eyes = new AvatarEyeGazeController(),
    composer = new ReactionGazeComposer();
  const profiles = allProfiles.presets[preset]?.[0] || {};
  let previous = 0;
  let frozenGaze = { yaw: 0, pitch: 0, x: 0, y: 0 };
  const composedEyes = new AvatarEyeGazeController();
  const entryStrength = 1 - smooth((command - (0.5 + 1 / 30)) / 0.18);
  const cases = [];
  for (let k = 0; k < active.length; k++) {
    const frame = active[k],
      t = frame.time;
    pointer.sample(t);
    if (k >= firstIndex && k <= firstIndex + 6) {
      const u = smooth((t - firstIndex / 30) / 0.18),
        target = pose(idle[k]);
      const predicted =
          scenario === 'exit' ? pose(baseline[k]) : model.sample(target, u),
        draws = structuredClone(frame.draws),
        delta = new Matrix4(),
        normal = new Matrix4();
      const gate =
        scenario === 'exit'
          ? smooth((t - (0.5 + 1 / 30 + coreSeconds)) / 0.18)
          : u;
      const neutralTranslation =
        scenario === 'exit'
          ? idle[k].draws[0].blocks.DrawBlock.slice(12, 15).map((v) => v * gate)
          : model.body.neutralTranslation.toArray();
      const frozenWeight =
        scenario === 'entry-gaze' ? entryStrength * (1 - u) : 0;
      composedEyes.x = frozenGaze.x * frozenWeight + eyes.x * gate;
      composedEyes.y = frozenGaze.y * frozenWeight + eyes.y * gate;
      composer.writeBodyCorrection(
        pointer.yaw + gaze.yaw * gate + frozenGaze.yaw * frozenWeight,
        pointer.pitch + gaze.pitch * gate + frozenGaze.pitch * frozenWeight,
        neutralTranslation,
        delta,
        normal,
      );
      const scale = new Vector3();
      (scenario === 'exit' ? predicted[0].world : model.body.world).decompose(
        new Vector3(),
        new Quaternion(),
        scale,
      );
      let worldError = 0,
        normalError = 0,
        fieldError = 0;
      const normalShortfalls = [];
      for (let p = 0; p < predicted.length; p++) {
        const out = predicted[p],
          raw = out.world.clone();
        out.world.premultiply(delta);
        out.normalMatrix.premultiply(normal);
        const profile = profiles[descriptions[p].id];
        if (profile && !descriptions[p].isFur) {
          const c = new Matrix4(),
            cn = new Matrix4();
          const closure =
            profile.blink === 'external'
              ? 0
              : eyeClosureFromMorph(out.fields.parameters, profile.blink);
          composer.writeEyeCorrection(
            composedEyes,
            profile,
            closure,
            1,
            neutralTranslation,
            scale.toArray(),
            raw,
            c,
            cn,
          );
          out.world.multiply(c);
          out.normalMatrix.multiply(cn);
        }
        const b = draws[p].blocks.DrawBlock;
        b.splice(0, 32, ...out.world.elements, ...out.normalMatrix.elements);
        fields.forEach((name, j) =>
          b.splice(32 + j * 4, 4, ...out.fields[name]),
        );
        const expected = frame.draws[p].blocks.DrawBlock,
          magnitude = Math.max(1, ...expected.slice(16, 32).map(Math.abs));
        worldError = Math.max(
          worldError,
          ...b.slice(0, 16).map((v, i) => Math.abs(v - expected[i])),
        );
        const ne =
          Math.max(
            ...b.slice(16, 32).map((v, i) => Math.abs(v - expected[16 + i])),
          ) / magnitude;
        normalError = Math.max(normalError, ne);
        if (ne >= 3e-7) normalShortfalls.push({ part: out.id, error: ne });
        fieldError = Math.max(
          fieldError,
          ...b.slice(32).map((v, i) => Math.abs(v - expected[32 + i])),
        );
      }
      cases.push({
        preset,
        scenario,
        frameIndex: k,
        time: t,
        u,
        predicted: draws,
        observed: frame.draws,
        base: baseline[frozenIndex].draws,
        metrics: { worldError, normalError, fieldError, normalShortfalls },
      });
    }
    if (frame.events.some((e) => e.kind === 'reaction'))
      frozenGaze = { yaw: gaze.yaw, pitch: gaze.pitch, x: eyes.x, y: eyes.y };
    gaze.advance(t - previous);
    eyes.advance(t - previous);
    previous = t;
    for (const e of frame.events) {
      if (e.kind === 'pointer-down') pointer.down(e.x, e.y, t);
      else if (e.kind === 'pointer') pointer.move(e.x, e.y);
      else if (e.kind === 'pointer-up' || e.kind === 'pointer-cancel')
        pointer.up(t);
      if (e.kind.startsWith('pointer')) {
        gaze.point(e.x, e.y);
        eyes.point(e.x, e.y);
      }
    }
  }
  return cases;
}
