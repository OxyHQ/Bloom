import type { SharedValue } from 'react-native-reanimated';
jest.mock('react-native-reanimated', () => ({
  ReduceMotion: { System: 'system' },
  withSpring: jest.fn((target: number) => target),
  withTiming: jest.fn((target: number) => target),
}));
import { withSpring, withTiming } from 'react-native-reanimated';
import { animateMotion, MOTION_RECIPES, type MotionIntent } from '../motion/recipes';
const shared = (value: number) => ({ value }) as SharedValue<number>;
beforeEach(() => jest.clearAllMocks());
it.each(Object.keys(MOTION_RECIPES) as MotionIntent[])('settles %s immediately under reduced motion', intent => {
  const value = shared(0.4);
  animateMotion(value, 1, intent, true);
  expect(value.value).toBe(1);
  expect(withSpring).not.toHaveBeenCalled();
  expect(withTiming).not.toHaveBeenCalled();
});
it('retargets expansion from its current value without resetting before spring assignment', () => {
  let current = 0.4;
  const writes: number[] = [];
  const value = { get value() { return current; }, set value(next: number) { writes.push(next); current = next; } } as SharedValue<number>;
  animateMotion(value, 1, 'expand');
  animateMotion(value, 0, 'expand');
  expect(writes).toEqual([1, 0]);
  expect(withSpring).toHaveBeenLastCalledWith(0, { duration: 380, dampingRatio: 1, reduceMotion: 'system' });
});
it.each(['press', 'present', 'dismiss'] as const)('uses system reduced motion for %s when no override was supplied', intent => {
  animateMotion(shared(0), 1, intent);
  expect(withTiming).toHaveBeenCalledWith(1, expect.objectContaining({ reduceMotion: 'system' }));
});
