import type { VectorPose } from './vector-pose';
import type { VectorMotionPose } from './vector-motion';
import {
  prepareReferenceFaceProjection,
  prepareReferenceHeadProjection,
  type VectorLook,
} from './vector-face';
import { projectedContour } from './vector-contour';
import { projectedVisibilityPaths, type OcclusionPart } from './vector-visibility';
import type { VectorAction, VectorChannel, VectorData, VectorFrame } from './vector-types';

const at = (values: number[], index: number) => values[index] ?? 0;
export function sampleVectorChannel(
  channel: VectorChannel,
  width: number,
  frame: number,
  quaternion = false,
): number[] {
  if (channel.value) return channel.value;
  const values = channel.samples;
  if (!values?.length || values.length % width !== 0)
    throw new Error('Invalid vector animation channel.');
  const last = values.length / width - 1;
  const position = Math.max(0, Math.min(last, frame));
  const first = Math.floor(position),
    next = Math.min(last, first + 1),
    fraction = position - first;
  let sign = 1;
  if (quaternion) {
    let dot = 0;
    for (let k = 0; k < width; k++)
      dot += at(values, first * width + k) * at(values, next * width + k);
    if (dot < 0) sign = -1;
  }
  const result = Array.from(
    { length: width },
    (_, k) =>
      at(values, first * width + k) * (1 - fraction) +
      at(values, next * width + k) * fraction * sign,
  );
  if (!quaternion) return result;
  const length = Math.hypot(...result);
  return length > 0 ? result.map((value) => value / length) : [0, 0, 0, 1];
}
function rotate(point: number[], quaternion: number[]): number[] {
  const [x = 0, y = 0, z = 0] = point,
    [qx = 0, qy = 0, qz = 0, qw = 1] = quaternion;
  const tx = 2 * (qy * z - qz * y),
    ty = 2 * (qz * x - qx * z),
    tz = 2 * (qx * y - qy * x);
  return [
    x + qw * tx + qy * tz - qz * ty,
    y + qw * ty + qz * tx - qx * tz,
    z + qw * tz + qx * ty - qy * tx,
  ];
}
export type VectorFrameOptions = {
  action: VectorAction;
  time: number;
  yaw?: number;
  pitch?: number;
  eyesOnly?: boolean;
  look?: VectorLook;
  pose?: VectorPose;
  motion?: VectorMotionPose;
};
/** Pure frame projection shared by browser and native SVG. No renderer or DOM dependency. */
export function renderVectorFrame(
  asset: VectorData,
  { action, time, yaw = 0, pitch = 0, eyesOnly = false, look, pose, motion }: VectorFrameOptions,
): VectorFrame {
  const clip = asset.clips[action];
  const elapsed = Math.max(
    0,
    action === 'idle' && clip.duration > 0 ? time % clip.duration : Math.min(time, clip.duration),
  );
  const frame = elapsed * clip.fps;
  const turn = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)],
    tilt = [Math.sin(pitch / 2), 0, 0, Math.cos(pitch / 2)];
  const face = asset.referenceFace;
  const projectFace = face && look ? prepareReferenceFaceProjection(face, look) : undefined;
  const projectHead = face && look ? prepareReferenceHeadProjection(face, look) : undefined;
  const faceTurn = face
    ? [0, Math.sin((yaw * face.gazeScale) / 2), 0, Math.cos((yaw * face.gazeScale) / 2)]
    : undefined;
  const faceTilt = face
    ? [Math.sin((pitch * face.gazeScale) / 2), 0, 0, Math.cos((pitch * face.gazeScale) / 2)]
    : undefined;
  const motionRotation = motion
    ? [0, 0, Math.sin(motion.roll / 2), Math.cos(motion.roll / 2)]
    : undefined;
  const projected: OcclusionPart[] = [],
    paths: VectorFrame['paths'] = [];
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const visibility = (track: (typeof clip.parts)[number] | undefined) => {
    if (!track) return 0;
    const coverage = sampleVectorChannel(track.coverage ?? { value: [1, 0, 0, 0] }, 4, frame);
    const camera = sampleVectorChannel(track.camera ?? { value: [1, 1, 0, 1] }, 4, frame);
    return Math.max(0, Math.min(1, at(coverage, 0))) * Math.max(0, Math.min(1, at(camera, 3)));
  };
  // Screen glyphs and hands belong to the panel assembly. Their authored tracks
  // can remain visible after the panel's coverage has reached zero.
  const panelIndex = asset.parts.findIndex((part) => part.role === 'panel');
  const workVisibility =
    panelIndex < 0 ? 1 : visibility(pose ? pose[panelIndex] : clip.parts[panelIndex]);
  for (let i = 0; i < asset.parts.length; i++) {
    const part = asset.parts[i]!,
      track = pose ? pose[i] : clip.parts[i];
    if (!track || (eyesOnly && part.role !== 'eye')) continue;
    const camera = sampleVectorChannel(track.camera ?? { value: [1, 1, 0, 1] }, 4, frame);
    const partVisibility = Math.min(
      visibility(track),
      ['panel', 'screen', 'hand'].includes(part.role ?? '') ? workVisibility : 1,
    );
    if (partVisibility < 0.001) continue;
    const translation = sampleVectorChannel(track.translation, 3, frame),
      rotation = sampleVectorChannel(track.rotation, 4, frame, true),
      scale = sampleVectorChannel(track.scale, 3, frame);
    const matrix = track.matrix ? sampleVectorChannel(track.matrix, 16, frame) : undefined;
    const parameters = track.parameters
      ? sampleVectorChannel(track.parameters, 4, frame).slice()
      : [0, 0, 0, 0];
    if (motion && part.role === 'eye') {
      const closure = 1 - (1 - at(parameters, 2)) * motion.lid;
      parameters[2] = closure;
      parameters[3] = closure * closure;
    }
    const points = part.points.map((point, index) => {
      let local = point.map(
        (value, k) =>
          value +
          (part.delta0?.[index]?.[k] ?? 0) * at(parameters, 2) +
          (part.delta1?.[index]?.[k] ?? 0) * at(parameters, 3),
      );
      if (face && (part.face || part.role === 'eye') && look && face.restBasis) {
        local = projectFace!(local);
      } else if (face && (part.face || part.role === 'eye')) {
        local = rotate(
          rotate(
            [at(local, 0) - face.center[0], at(local, 1) - face.center[1], at(local, 2)],
            faceTurn!,
          ),
          faceTilt!,
        );
        local[0] = at(local, 0) + face.center[0];
        local[1] = at(local, 1) + face.center[1];
      }
      if (face && part.head && look) local = projectHead!(local);
      let world: number[];
      if (matrix) {
        world = [0, 1, 2].map(
          (k) =>
            at(matrix, k) * at(local, 0) +
            at(matrix, 4 + k) * at(local, 1) +
            at(matrix, 8 + k) * at(local, 2) +
            at(matrix, 12 + k),
        );
      } else {
        for (let k = 0; k < 3; k++) local[k] = at(local, k) * at(scale, k);
        world = rotate(local, rotation);
        for (let k = 0; k < 3; k++) world[k] = at(world, k) + at(translation, k);
      }
      if (!face) world = rotate(rotate(world, turn), tilt);
      if (face && ['hand', 'panel', 'screen'].includes(part.role ?? ''))
        world[1] = at(world, 1) - 0.75;
      if (motion) {
        for (let k = 0; k < 3; k++) world[k] = at(world, k) * motion.scale;
        world = rotate(world, motionRotation!);
        world[1] = at(world, 1) + motion.bob;
      }
      const result = [
        160 + at(world, 0) * at(camera, 0) * 87,
        187 - (at(world, 1) * at(camera, 1) + at(camera, 2)) * 87,
        at(world, 2),
      ];
      if (eyesOnly) {
        bounds[0] = Math.min(bounds[0]!, result[0]!);
        bounds[1] = Math.min(bounds[1]!, result[1]!);
        bounds[2] = Math.max(bounds[2]!, result[0]!);
        bounds[3] = Math.max(bounds[3]!, result[1]!);
      }
      return result;
    });
    const fill = part.color ?? '#171717',
      opacity = partVisibility,
      fillOpacity = part.opacity ?? (part.role === 'panel' ? 0.22 : 1);
    const opaque = part.role !== 'panel' && opacity * fillOpacity >= 0.999;
    projected.push({ i, points, faces: part.faces, opaque, group: opaque ? fill : undefined });
    paths.push({
      id: String(i),
      role: part.role,
      d: projectedContour(points, part),
      fill,
      opacity,
      fillOpacity,
      ...(part.stroke
        ? { stroke: part.stroke, strokeWidth: part.strokeWidth ?? 2 }
        : part.role === 'panel'
          ? { stroke: fill }
          : {}),
    });
  }
  const masks = projectedVisibilityPaths(projected);
  for (const path of paths) {
    const mask = masks.get(Number(path.id));
    if (mask !== null && mask !== undefined) path.clip = mask;
  }
  paths.sort((a, b) => {
    const layer = (role?: string) => (role === 'screen' ? 2 : role === 'panel' ? 1 : 0);
    return layer(a.role) - layer(b.role) || Number(a.id) - Number(b.id);
  });
  const width = bounds[2]! - bounds[0]!,
    height = bounds[3]! - bounds[1]!;
  const padding = Math.max(width, height) * 0.15;
  const viewBox =
    eyesOnly && Number.isFinite(width) && width > 0 && height > 0
      ? `${bounds[0]! - padding} ${bounds[1]! - padding} ${width + 2 * padding} ${height + 2 * padding}`
      : '0 0 320 320';
  return { paths, viewBox };
}
