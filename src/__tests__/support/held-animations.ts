import * as Reanimated from 'react-native-reanimated';

/**
 * The reanimated MOCK settles every animation synchronously: `withSpring` and
 * `withTiming` call their completion callback before they return. A component
 * whose transition ENDS in that callback (the media gallery lands its fly-back
 * there) therefore finishes the moment it starts, and "mid-transition" cannot be
 * reached through its public path.
 *
 * This holds the callbacks instead, like a real animation that has not finished
 * yet, until `land()` runs them in order. An instrument, not a seam in the
 * source. `held()` is its own positive control: a spy that intercepted nothing
 * would also report a transition still under way.
 */
export function holdAnimations(): { land: () => void; held: () => number; restore: () => void } {
  const pending: Array<(finished: boolean) => void> = [];
  const hold = (value: number, _config?: unknown, callback?: (finished: boolean) => void) => {
    if (callback) pending.push(callback);
    return value;
  };
  const spring = jest.spyOn(Reanimated, 'withSpring').mockImplementation(hold as never);
  const timing = jest.spyOn(Reanimated, 'withTiming').mockImplementation(hold as never);
  return {
    land: () => {
      while (pending.length > 0) pending.shift()?.(true);
    },
    held: () => pending.length,
    restore: () => {
      spring.mockRestore();
      timing.mockRestore();
    },
  };
}
