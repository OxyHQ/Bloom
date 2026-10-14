/**
 * How much of the backdrop a sheet at `translateY` still earns: all of it at rest (`0`), none
 * once it has travelled its own height, and a straight line between, so the blur and the dim go
 * away exactly as fast as the sheet does under the finger.
 *
 * `travel` is the distance to be fully out of sight: the sheet's measured height, or the
 * screen's until it has been measured. A worklet: it runs on the UI thread with the drag.
 */
export function backdropFade(translateY: number, travel: number): number {
  'worklet';
  if (travel <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - translateY / travel));
}
