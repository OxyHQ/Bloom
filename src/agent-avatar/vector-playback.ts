import type { VectorAction, VectorData } from './vector-types';
import type { VectorPose } from './vector-pose';
import type { VectorMotionPose } from './vector-motion';

export const VECTOR_TRANSITION_SECONDS = 0.28;
/** The longest a frame may advance the clock: a stalled tab resumes where it was, not far ahead. */
export const VECTOR_MAX_FRAME_SECONDS = 0.064;

/**
 * Seconds a frame advances the avatar's clock, from the timestamps of this frame and the last.
 *
 * Only a finite, forward step counts. A frame callback that carries no timestamp (a shimmed
 * `requestAnimationFrame`, a webview that omits it), one that runs backwards, or a first frame has
 * a delta of zero. The clock is added to every frame and kept for the life of the avatar, so one
 * non-finite step would make every later pose, and every path drawn from it, `NaN`.
 */
export function vectorFrameDelta(now: number, last: number | undefined): number {
  if (last === undefined || !Number.isFinite(now) || !Number.isFinite(last)) return 0;
  return Math.max(0, Math.min(VECTOR_MAX_FRAME_SECONDS, (now - last) / 1000));
}
export type VectorPlayback = {
  action: VectorAction;
  time: number;
  clock: number;
  repeats: number;
  transitionStarted: number;
  transitionDuration: number;
  lastPose?: VectorPose;
  poseFrom?: VectorPose;
  lastMotion?: VectorMotionPose;
  motionFrom?: VectorMotionPose;
};

/** Capture the painted pose, including an interrupted blend, without restarting the host. */
export function playVectorAction(
  state: VectorPlayback,
  action: VectorAction,
  repeats = 1,
  duration = VECTOR_TRANSITION_SECONDS,
) {
  state.poseFrom = state.lastPose;
  state.motionFrom = state.lastMotion;
  state.transitionStarted = state.clock;
  state.transitionDuration = duration;
  state.action = action;
  state.time = 0;
  state.repeats = Number.isFinite(repeats) ? Math.max(1, Math.floor(repeats)) : 1;
}

/** The final work exit belongs to its episode, not to an extra tail after completion. */
export function advanceVectorPlayback(state: VectorPlayback, asset: VectorData, delta: number) {
  state.time += delta;
  state.clock += delta;
  if (state.action === 'idle') return;
  const duration = asset.clips[state.action].duration;
  if (
    state.action === 'work' &&
    state.repeats === 1 &&
    state.time >= Math.max(0, duration - VECTOR_TRANSITION_SECONDS)
  ) {
    playVectorAction(state, 'idle', 1, Math.max(0.001, duration - state.time));
  } else if (state.time >= duration) {
    playVectorAction(
      state,
      state.action === 'work' && state.repeats > 1 ? 'work' : 'idle',
      state.repeats - 1,
    );
  }
}
