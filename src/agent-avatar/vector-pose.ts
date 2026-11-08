import { sampleVectorChannel } from './vector-frame';
import type { VectorAction, VectorData, VectorTrack } from './vector-types';

export type VectorPose = (VectorTrack | null)[];
const channels = {
  translation: 3,
  rotation: 4,
  scale: 3,
  camera: 4,
  coverage: 4,
  matrix: 16,
  parameters: 4,
} as const;
const defaults = {
  translation: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
  camera: [1, 1, 0, 1],
  coverage: [1, 0, 0, 0],
  matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  parameters: [0, 0, 0, 0],
};

/** Snapshot all authored channels, including the currently visible work props. */
export function sampleVectorPose(
  asset: VectorData,
  action: VectorAction,
  time: number,
): VectorPose {
  const clip = asset.clips[action];
  const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0;
  const elapsed =
    action === 'idle' && clip.duration > 0
      ? safeTime % clip.duration
      : Math.min(safeTime, clip.duration);
  return clip.parts.map((track) => {
    if (!track) return null;
    const snapshot = {} as VectorTrack;
    for (const key of Object.keys(channels) as (keyof typeof channels)[]) {
      const channel = track[key];
      if (channel)
        snapshot[key] = {
          value: sampleVectorChannel(
            channel,
            channels[key],
            elapsed * clip.fps,
            key === 'rotation',
          ).slice(),
        };
    }
    return snapshot;
  });
}

/** Blend frozen poses. Callers capture this result before interrupting a transition. */
export function blendVectorPose(from: VectorPose, to: VectorPose, amount: number): VectorPose {
  const mix = Number.isFinite(amount) ? Math.max(0, Math.min(1, amount)) : 0;
  return Array.from({ length: Math.max(from.length, to.length) }, (_, i) => {
    const left = from[i],
      right = to[i];
    if (!left && !right) return null;
    const a = left ?? right!,
      b = right ?? left!;
    const result = {} as VectorTrack;
    for (const key of Object.keys(channels) as (keyof typeof channels)[]) {
      if (!a[key] && !b[key] && key !== 'coverage') continue;
      const av = (a[key]?.value ?? defaults[key]).slice(),
        bv = (b[key]?.value ?? defaults[key]).slice();
      if (key === 'coverage') {
        if (!left) av[0] = 0;
        if (!right) bv[0] = 0;
      }
      let sign = 1;
      if (key === 'rotation' && av.reduce((sum, value, k) => sum + value * (bv[k] ?? 0), 0) < 0)
        sign = -1;
      let value = av.map((v, k) => v * (1 - mix) + (bv[k] ?? 0) * mix * sign);
      if (key === 'rotation') {
        const length = Math.hypot(...value);
        value = length ? value.map((v) => v / length) : [0, 0, 0, 1];
      }
      result[key] = { value };
    }
    return result;
  });
}
