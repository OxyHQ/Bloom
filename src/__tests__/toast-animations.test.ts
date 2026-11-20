import { toastEnterKeyframes, toastExitKeyframes } from '../toast/animations';
import { MOTION } from '../motion/tokens';
import type { ToastPosition } from '../toast/types';

/** A keyframes value's frames as `[at, opacity, translateY]`. */
const frames = (value: ReturnType<typeof toastEnterKeyframes>) =>
  value.frames.map((frame) => [
    frame.at,
    frame.opacity,
    (frame.transform[0] as { translateY: number } | undefined)?.translateY,
  ]);

describe('the toast’s enter and exit, as Bloom motion keyframes', () => {
  it.each<[ToastPosition, number]>([
    ['top-center', -20],
    ['bottom-center', 50],
    ['bottom-right', 50],
    ['center', 50],
  ])(
    'a %s row rises %s px into its slot as it fades in, over the enter motion',
    (position, from) => {
      const enter = toastEnterKeyframes(position);
      expect(frames(enter)).toEqual([
        [0, 0, from],
        [1, 1, 0],
      ]);
      expect(enter.motion).toBe(MOTION.enter);
      expect(toastEnterKeyframes(position)).toBe(enter);
    },
  );

  it('a single row leaves by 12 px, fading through 0.35 at half way, linearly over 180 ms', () => {
    const exit = toastExitKeyframes({
      position: 'bottom-center',
      isHiddenByLimit: false,
      isSingle: true,
      stackGap: 8,
    });
    expect(frames(exit)).toEqual([
      [0, 1, 0],
      [0.5, 0.35, 9],
      [1, 0, 12],
    ]);
    expect(exit.motion).toBe(MOTION.exit);
    expect(MOTION.exit.duration).toBe(180);
  });

  it('a stacked row leaves by no more than the stack gap; a row from the top leaves upward', () => {
    expect(
      frames(
        toastExitKeyframes({
          position: 'bottom-center',
          isHiddenByLimit: false,
          isSingle: false,
          stackGap: 8,
        }),
      )[2],
    ).toEqual([1, 0, 8]);
    expect(
      frames(
        toastExitKeyframes({
          position: 'top-center',
          isHiddenByLimit: false,
          isSingle: true,
          stackGap: 8,
        }),
      )[2],
    ).toEqual([1, 0, -12]);
  });

  it('a row culled by the limit only fades', () => {
    const exit = toastExitKeyframes({
      position: 'bottom-center',
      isHiddenByLimit: true,
      isSingle: false,
      stackGap: 8,
    });
    expect(frames(exit).map(([, , y]) => y)).toEqual([0, 0, 0]);
  });
});
