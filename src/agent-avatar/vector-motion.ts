import type { VectorAction } from './vector-types';

export type VectorMotionPose = {
  /** Absolute gaze in radians; positive pitch looks down. */
  yaw: number;
  pitch: number;
  roll: number;
  /** Body displacement in avatar world units. Apply to props with the body. */
  bob: number;
  /** Uniform body scale, preserving circular silhouettes. */
  scale: number;
  /** Eye openness only: 1 open, 0 closed. Never deform eyewear. */
  lid: number;
};
export type VectorMotionOptions = {
  time: number;
  state: VectorAction;
  stateTime?: number;
  /** Stable canonical identity; omit to preserve the original rhythm. */
  personalityKey?: string;
  workLook?: { yaw: number; pitch: number };
  look?: { yaw: number; pitch: number; mix: number; wander?: number };
  /** Capture the currently displayed pose when a transition is interrupted. */
  transition?: { from: VectorMotionPose; startedAt: number; duration?: number };
};
const finite = (value: number, fallback = 0) => (Number.isFinite(value) ? value : fallback);
const unit = (value: number) => Math.max(0, Math.min(1, finite(value)));
const ease = (value: number) => {
  const t = unit(value);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A fixed, nonuniform schedule repeats without random state or a clock. */
function openness(time: number): number {
  const phase = time % 23;
  for (const start of [1.7, 5.1, 5.39, 9.8, 13.2, 17.6, 21.1]) {
    const elapsed = phase - start;
    if (elapsed < 0 || elapsed >= 0.2) continue;
    return elapsed < 0.075 ? 1 - ease(elapsed / 0.075) : ease((elapsed - 0.075) / 0.125);
  }
  return 1;
}

/** Pure sampling: repeated timestamps and pause/resume produce identical poses. */
export function sampleVectorMotion(options: VectorMotionOptions): VectorMotionPose {
  const time = Math.max(0, finite(options.time));
  // Identity changes rhythm, never geometry or authored clip timing.
  let hash = 0;
  for (const char of options.personalityKey ?? '') hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const personalized = !!options.personalityKey;
  const tempo = personalized ? 0.88 + (hash % 25) / 100 : 1;
  const phase = personalized ? ((hash >>> 5) % 31) / 10 : 0;
  const phasedTime = (t: number) => t * tempo + phase * (1 - Math.exp(-t * 0.5));
  const eyeTime = phasedTime(time);
  const bodyTime = phasedTime(Math.max(0, time - (personalized ? 0.16 : 0)));
  const local = Math.max(0, finite(options.stateTime ?? time));
  const look = options.look;
  const validLook = look && Number.isFinite(look.yaw) && Number.isFinite(look.pitch);
  const aim = validLook ? unit(look.mix) : 0;
  const wander = validLook ? unit(look.wander ?? 1 - aim) : 1;
  const reaction = options.state === 'reaction' ? Math.sin(Math.PI * unit(local / 0.9)) ** 2 : 0;
  const bodyReaction =
    personalized && options.state === 'reaction'
      ? Math.sin(Math.PI * unit((local - 0.16) / 0.9)) ** 2
      : reaction;
  const working = options.state === 'work';
  // The work clip remains the timing authority. A smooth brief screen glance
  // interrupts the keyboard focus once per episode, without stopping the hands.
  const screenGlance =
    personalized && working ? Math.sin(Math.PI * unit((local - 0.9) / 0.8)) ** 2 : 0;
  const automaticYaw = working
    ? finite(options.workLook?.yaw ?? 0.35) * (1 - screenGlance * 0.12)
    : reaction * -0.12;
  const automaticPitch = working
    ? Math.max(0.12, finite(options.workLook?.pitch ?? 0.35) - screenGlance * 0.07)
    : reaction * -0.1;
  const pose: VectorMotionPose = {
    yaw:
      mix(automaticYaw, validLook ? look.yaw : 0, aim) +
      (Math.sin(eyeTime * 0.61) * 0.055 + Math.sin(eyeTime * 1.43) * 0.018) * wander,
    pitch:
      mix(automaticPitch, validLook ? look.pitch : 0, aim) +
      (Math.sin(eyeTime * 0.47) * 0.035 + Math.sin(eyeTime * 1.17) * 0.012) * wander,
    roll: Math.sin(bodyTime * 0.53) * 0.012 + bodyReaction * 0.045,
    bob: Math.sin(bodyTime * 1.09) * 0.006 + bodyReaction * 0.025,
    scale: 1 + Math.sin(bodyTime * 1.71) * 0.003 + bodyReaction * 0.012,
    lid: openness(eyeTime),
  };
  const transition = options.transition;
  if (!transition) return pose;
  const duration = Math.max(0.001, finite(transition.duration ?? 0.28, 0.28));
  const blend = ease((time - finite(transition.startedAt)) / duration);
  for (const key of Object.keys(pose) as (keyof VectorMotionPose)[]) {
    pose[key] = mix(finite(transition.from[key], pose[key]), pose[key], blend);
  }
  pose.lid = unit(pose.lid);
  return pose;
}

/** A brief screen-reading pause shared by authored hands and procedural gaze.
 * Wall-clock playback and the final exit envelope remain unchanged. */
export function referenceWorkTime(time: number): number {
  if (!Number.isFinite(time)) return 0;
  if (time <= 1.15 || time >= 2.25) return time;
  if (time < 1.45) {
    const u = (time - 1.15) / 0.3;
    // Integral of 1-smoothstep(u): velocity smoothly falls from one to zero.
    return 1.15 + 0.3 * (u - u ** 3 + u ** 4 / 2);
  }
  if (time <= 1.55) return 1.3;
  const u = (time - 1.55) / 0.7;
  // Monotone Hermite catch-up: zero entering velocity, unit exiting velocity.
  return (
    (2 * u ** 3 - 3 * u ** 2 + 1) * 1.3 +
    (-2 * u ** 3 + 3 * u ** 2) * 2.25 +
    (u ** 3 - u ** 2) * 0.7
  );
}
