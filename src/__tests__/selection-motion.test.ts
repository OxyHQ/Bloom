import type { SharedValue } from 'react-native-reanimated';
jest.mock('react-native-reanimated', () => ({
  ReduceMotion: { System: 'system' },
  withSpring: jest.fn((target: number) => target),
  withTiming: jest.fn((target: number) => target),
}));
import { withSpring, withTiming } from 'react-native-reanimated';
import { moveSelection } from '../motion/selection-motion';

const value = (initial: number) => ({ value: initial }) as SharedValue<number>;
beforeEach(() => jest.clearAllMocks());

it('fades a missing selection in place instead of sweeping across other controls', () => {
  const position = value(2);
  const opacity = value(1);
  moveSelection(position, opacity, null);
  expect(position.value).toBe(2);
  expect(opacity.value).toBe(0);
  expect(withSpring).not.toHaveBeenCalled();
  expect(withTiming).toHaveBeenCalledWith(0, { duration: 160, reduceMotion: 'system' });
});

it('appears at a new target when fully hidden, without a phantom slide', () => {
  const position = value(2);
  const opacity = value(0);
  moveSelection(position, opacity, 5);
  expect(position.value).toBe(5);
  expect(opacity.value).toBe(1);
  expect(withSpring).not.toHaveBeenCalled();
});

it('retargets visible capsules, including interrupted fades, with the same spring', () => {
  const position = value(2);
  const opacity = value(0.3);
  moveSelection(position, opacity, 5);
  expect(withSpring).toHaveBeenCalledWith(5, {
    duration: 420,
    dampingRatio: 0.82,
    reduceMotion: 'system',
  });
  expect(withTiming).toHaveBeenCalledWith(1, { duration: 160, reduceMotion: 'system' });
});

it.each([0, 0.5, 1])('never overwrites a pager or scrub driver at opacity %s', (initial) => {
  const position = value(1.4);
  const opacity = value(initial);
  moveSelection(position, opacity, 5, true);
  expect(position.value).toBe(1.4);
  expect(opacity.value).toBe(1);
  expect(withSpring).not.toHaveBeenCalled();
});
