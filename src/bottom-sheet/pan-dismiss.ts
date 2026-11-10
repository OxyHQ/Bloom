/** A flick faster than this (px/s, downward) closes the sheet at any distance. */
const FAST_SWIPE_VELOCITY = 900;
/** A pull deeper than this closes it, unless the finger is already moving back up faster than this. */
const RETURN_VELOCITY = -300;
const MIN_CLOSE_DISTANCE = 140;
const CLOSE_DISTANCE_FRACTION = 0.25;

/** Whether a released pan closes the sheet: one rule for every pan the sheet owns. */
export function shouldClosePan(distance: number, velocity: number, screenHeight: number): boolean {
  'worklet';
  const closeDistance = Math.max(MIN_CLOSE_DISTANCE, screenHeight * CLOSE_DISTANCE_FRACTION);
  return velocity > FAST_SWIPE_VELOCITY || (distance > closeDistance && velocity > RETURN_VELOCITY);
}
