import type { MotionKind, MotionSamplers } from './motion-catalog';

export type MotionState = {
  kind: MotionKind;
  started: number;
  held?: number;
  /** New user commands start on their first presentation, not the previous RAF. */
  pendingStart?: boolean;
  continuous?: boolean;
  remainingCycles?: number;
  queuedReaction?: boolean;
};

/** Move only at an independently verified idle seam. Preserve elapsed time
 * beyond the boundary, including when a frame spans two completed reactions. */
export function advanceMotion(
  motion: MotionState | undefined,
  samplers: MotionSamplers,
  now: number,
): MotionState | undefined {
  if (motion?.pendingStart) {
    const { pendingStart: _pendingStart, ...presented } = motion;
    return { ...presented, started: now };
  }
  if (
    !motion ||
    motion.held !== undefined ||
    motion.kind === 'idle' ||
    (motion.kind === 'work' && motion.continuous)
  )
    return motion;
  const duration =
    motion.kind === 'work'
      ? samplers.workReturn?.time
      : samplers.reaction?.clip.duration;
  if (duration === undefined || now < motion.started + duration) return motion;
  if (
    motion.kind === 'work' &&
    (motion.remainingCycles ?? 1) > 1 &&
    duration > 0
  ) {
    const completed = Math.min(
      motion.remainingCycles!,
      Math.floor((now - motion.started) / duration),
    );
    if (completed < motion.remainingCycles!)
      return {
        ...motion,
        started: motion.started + completed * duration,
        remainingCycles: motion.remainingCycles! - completed,
      };
    motion = {
      ...motion,
      started: motion.started + (motion.remainingCycles! - 1) * duration,
      remainingCycles: 1,
    };
  }
  const end = motion.started + duration;
  if (motion.kind === 'reaction' && motion.queuedReaction)
    return advanceMotion({ kind: 'reaction', started: end }, samplers, now);
  const idleTime =
    motion.kind === 'work'
      ? samplers.workReturn?.idleTime
      : samplers.reactionReturnTime;
  return idleTime === undefined
    ? motion
    : { kind: 'idle', started: end - idleTime };
}
