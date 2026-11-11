import { animatePanelFlex, type PanelFlexValues } from '../app-shell/panel-motion';

const timings: {
  to: number;
  duration: number;
  delay?: number;
  complete?: (finished: boolean) => void;
}[] = [];
jest.mock('react-native-reanimated', () => ({
  Easing: { bezier: () => (value: number) => value },
  cancelAnimation: jest.fn(),
  runOnJS: (fn: () => void) => fn,
  withTiming: (
    to: number,
    options: { duration: number },
    complete?: (finished: boolean) => void,
  ) => {
    const animation = { to, duration: options.duration, complete };
    timings.push(animation);
    return animation;
  },
  withDelay: (delay: number, animation: { delay?: number }) => {
    animation.delay = delay;
    return animation;
  },
}));
function values(grow = 1, min = 160, gap = 8) {
  return Object.fromEntries(
    Object.entries({ grow, basis: 0, min, gap, max: Infinity, opacity: 1, scale: 1 }).map(
      ([key, value]) => [key, { value }],
    ),
  ) as unknown as PanelFlexValues;
}
const closed = { grow: 0, basis: 0, min: 0, gap: 0, max: Infinity, visible: false };
beforeEach(() => {
  timings.length = 0;
});
it('reports the changed grow geometry, not a no-op zero basis or early ordered fade', () => {
  const complete = jest.fn();
  animatePanelFlex(values(), closed, true, false, complete);
  const completions = timings.filter((animation) => animation.complete);
  expect(completions).toHaveLength(1);
  expect(completions[0]).toMatchObject({ duration: 380, delay: 150 });
  expect(timings[1]?.complete).toBeUndefined();
  completions[0]?.complete?.(false);
  expect(complete).not.toHaveBeenCalled();
  completions[0]?.complete?.(true);
  expect(complete).toHaveBeenCalledTimes(1);
});
it('waits for owned paint when no geometry changes', () => {
  const complete = jest.fn();
  animatePanelFlex(values(0, 0, 0), closed, true, false, complete);
  const completions = timings.filter((animation) => animation.complete);
  expect(completions).toHaveLength(1);
  expect(completions[0]).toMatchObject({ duration: 150, delay: 0 });
  expect(complete).not.toHaveBeenCalled();
  completions[0]?.complete?.(true);
  expect(complete).toHaveBeenCalledTimes(1);
});
it('immediate exit completes after its values settle and entry never reports an exit', () => {
  const state = values();
  const complete = jest.fn(() => {
    expect(state.grow.value).toBe(0);
    expect(state.min.value).toBe(0);
  });
  animatePanelFlex(state, closed, false, true, complete);
  expect(complete).toHaveBeenCalledTimes(1);
  animatePanelFlex(values(), { ...closed, visible: true }, false, false, complete);
  expect(timings.every((animation) => !animation.complete)).toBe(true);
});
