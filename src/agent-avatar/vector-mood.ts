import type { VectorLook } from './vector-face';
import type { VectorMotionPose } from './vector-motion';
import type { VectorData } from './vector-types';
import type { AgentAvatarMood } from './types';

/**
 * How a mood is laid over whatever the character is doing. It is procedural, like gaze and
 * blinking: every body, preset or edited, has its authored clips and none of them a "no", so the
 * mood moves the pose those clips produce rather than adding a clip that only some bodies would
 * have.
 */
export type VectorMoodState = {
  /** How far into its mood the character is: 0 neutral, 1 fully sad. Eases, never jumps. */
  sadness: number;
  /** Seconds into the head shake that starts a sad mood. Past `VECTOR_DECLINE_SECONDS`, none. */
  declineTime: number;
};

/** The shake that says "no": three turns, the first the widest, coming to rest. */
export const VECTOR_DECLINE_SECONDS = 1.4;
/** How quickly the dejected pose sets in and lifts, per second. Settled in about a second. */
const SADNESS_RATE = 2.5;
const DECLINE_YAW = 0.6;

/** A neutral pose that a mood can be laid on: no turn, no droop, eyes open. */
export const VECTOR_REST_MOTION: Readonly<VectorMotionPose> = {
  yaw: 0,
  pitch: 0,
  roll: 0,
  bob: 0,
  scale: 1,
  lid: 1,
};

const unit = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0);
const ease = (value: number) => {
  const t = unit(value);
  return t * t * (3 - 2 * t);
};

/** The state a character starts in, with or without the mood. Starting sad shakes the head. */
export function initialVectorMood(mood: AgentAvatarMood | undefined): VectorMoodState {
  return { sadness: 0, declineTime: mood === 'sad' ? 0 : Number.POSITIVE_INFINITY };
}

/** The mood the character is now asked for. Becoming sad shakes the head once. */
export function setVectorMood(
  state: VectorMoodState,
  mood: AgentAvatarMood | undefined,
  previous: AgentAvatarMood | undefined,
) {
  if (mood === 'sad' && previous !== 'sad') state.declineTime = 0;
}

/** One frame of a running character: the shake moves on and the droop eases towards the mood. */
export function advanceVectorMood(
  state: VectorMoodState,
  mood: AgentAvatarMood | undefined,
  delta: number,
) {
  const target = mood === 'sad' ? 1 : 0;
  state.declineTime += delta;
  state.sadness += (target - state.sadness) * (1 - Math.exp(-delta * SADNESS_RATE));
  if (Math.abs(target - state.sadness) < 0.001) state.sadness = target;
}

/** A still character (paused, reduced motion) shows the mood's settled pose and never shakes. */
export function settleVectorMood(state: VectorMoodState, mood: AgentAvatarMood | undefined) {
  state.sadness = mood === 'sad' ? 1 : 0;
  state.declineTime = Number.POSITIVE_INFINITY;
}

/** Whether the mood moves the pose at all; a neutral character draws exactly as it did without one. */
export function vectorMoodActive(state: VectorMoodState): boolean {
  return state.sadness > 0 || state.declineTime < VECTOR_DECLINE_SECONDS;
}

/**
 * The head turn of the shake, in radians, at `time` seconds into it: zero before and after, and
 * it starts and ends at rest with no jump in speed. The swings shrink as the head gives up.
 */
export function sampleVectorDecline(time: number): number {
  if (!(time > 0 && time < VECTOR_DECLINE_SECONDS)) return 0;
  const u = time / VECTOR_DECLINE_SECONDS;
  return DECLINE_YAW * ease(u / 0.12) * (1 - u) ** 2 * Math.sin(Math.PI * 6 * u);
}

/**
 * `pose` with the mood laid over it. Sad looks down and a little aside, sinks and deflates
 * slightly, tilts the head and lets the lids fall; the shake turns the head and rocks it a little
 * with each turn. Blinks and breathing carry on underneath.
 */
export function applyVectorMood(pose: VectorMotionPose, state: VectorMoodState): VectorMotionPose {
  const sad = unit(state.sadness),
    shake = sampleVectorDecline(state.declineTime);
  return {
    yaw: pose.yaw + shake - sad * 0.1,
    pitch: pose.pitch + sad * 0.3,
    roll: pose.roll + shake * 0.12 + sad * 0.06,
    bob: pose.bob - sad * 0.04,
    scale: pose.scale * (1 - sad * 0.03),
    lid: unit(pose.lid * (1 - sad * 0.4)),
  };
}

export type VectorMoodFrame = {
  /** The turn of the whole drawing (and of a reference face without a rest basis). */
  yaw: number;
  pitch: number;
  motion?: VectorMotionPose;
  /** A reference face's head direction. */
  look?: VectorLook;
};

/**
 * What `renderVectorFrame` draws a character with, the mood laid on. `procedural` is a reference
 * face's sampled motion (undefined for other bodies) and `turn` the pointer's turn. The mood's
 * turn goes everywhere a head can turn: a reference face's `look`, and the frame's own turn, which
 * is how a body with no head of its own (and a face fitted without a rest basis) shakes. A neutral
 * character draws exactly as it did without a mood.
 */
export function vectorMoodFrame(
  asset: VectorData,
  procedural: VectorMotionPose | undefined,
  turn: { yaw: number; pitch: number },
  mood: VectorMoodState | undefined,
): VectorMoodFrame {
  const look = (motion: VectorMotionPose | undefined) =>
    asset.referenceFace && motion ? { yaw: motion.yaw, pitch: motion.pitch, mix: 1 } : undefined;
  if (!mood || !vectorMoodActive(mood))
    return { ...turn, motion: procedural, look: look(procedural) };
  const base = procedural ?? VECTOR_REST_MOTION,
    motion = applyVectorMood(base, mood);
  return {
    yaw: turn.yaw + motion.yaw - base.yaw,
    pitch: turn.pitch + motion.pitch - base.pitch,
    motion,
    look: look(motion),
  };
}
