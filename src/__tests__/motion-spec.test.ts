import type { SharedValue } from 'react-native-reanimated';
jest.mock('react-native-reanimated', () => ({
  ReduceMotion: { System: 'system' },
  Easing: { bezier: jest.fn((...curve: number[]) => ({ curve })) },
  withSpring: jest.fn((target: number) => target),
  withTiming: jest.fn((target: number) => target),
}));
import { withSpring, withTiming } from 'react-native-reanimated';
import {
  animateWithSpec,
  cubicBezierProgressAt,
  motionCss,
  motionDurationMs,
  motionProgressAt,
  springPhysics,
  springProgressAt,
  springSettleMs,
  type SpringSpec,
} from '../motion/spec';

const DOCK: SpringSpec = { response: 0.215, dampingRatio: 0.79 };

// A desktop browser's sidebar hiding and showing, its content edge traced on a
// 240 fps screen recording (three runs; seconds, fraction of the travel). The
// recorder delivered frames 17–33 ms apart, so each point is good to a frame.
const RECORDED_DOCK = [
  [0.0337, 0.303],
  [0.0629, 0.616],
  [0.0837, 0.805],
  [0.1212, 0.968],
  [0.1379, 1.011],
  [0.1629, 1.011],
  [0.1837, 1.003],
  [0.0263, 0.246],
  [0.0596, 0.524],
  [0.0805, 0.8],
  [0.1055, 0.951],
  [0.1305, 1.008],
  [0.1555, 1.011],
  [0.1805, 1.003],
  [0.0324, 0.316],
  [0.0657, 0.586],
  [0.0949, 0.846],
  [0.1032, 0.973],
  [0.1365, 1.011],
  [0.1532, 1.011],
  [0.1782, 1.005],
] as const;

const shared = (value: number) => ({ value }) as SharedValue<number>;
beforeEach(() => jest.clearAllMocks());

describe('springs as data', () => {
  it('follows the recorded dock within the recording jitter', () => {
    const rms = Math.sqrt(
      RECORDED_DOCK.reduce((sum, [t, x]) => sum + (springProgressAt(DOCK, t) - x) ** 2, 0) /
        RECORDED_DOCK.length,
    );
    expect(rms).toBeLessThan(0.04);
    expect(springProgressAt(DOCK, 0.1)).toBeGreaterThan(0.88);
    const peak = Math.max(...Array.from({ length: 60 }, (_, i) => springProgressAt(DOCK, i / 120)));
    expect(peak).toBeGreaterThan(1.005);
    expect(peak).toBeLessThan(1.03);
    expect(Math.abs(springProgressAt(DOCK, 0.3) - 1)).toBeLessThan(0.003);
  });

  it('converts response and ratio to the physics Reanimated integrates', () => {
    const { mass, stiffness, damping } = springPhysics(DOCK);
    expect(mass).toBe(1);
    const omega = Math.sqrt(stiffness);
    expect(omega).toBeCloseTo((2 * Math.PI) / 0.215, 9);
    expect(damping / (2 * omega)).toBeCloseTo(0.79, 9);
  });

  it('integrates to the closed form (the oscillator Reanimated steps)', () => {
    for (const spec of [
      DOCK,
      { response: 0.3, dampingRatio: 1 },
      { response: 0.25, dampingRatio: 1.4 },
    ]) {
      const { stiffness, damping } = springPhysics(spec);
      let x = 0;
      let v = 0;
      const dt = 1 / 20000;
      for (let step = 1; step <= 4000; step++) {
        v += (-stiffness * (x - 1) - damping * v) * dt;
        x += v * dt;
        if (step % 400 === 0) expect(x).toBeCloseTo(springProgressAt(spec, step * dt), 2);
      }
    }
  });

  it('settles where the closed form stops moving', () => {
    const settle = springSettleMs(DOCK);
    expect(settle).toBeGreaterThan(200);
    expect(settle).toBeLessThan(400);
    for (let ms = settle; ms < settle + 500; ms += 7)
      expect(Math.abs(springProgressAt(DOCK, ms / 1000) - 1)).toBeLessThan(0.001);
    expect(motionDurationMs(DOCK)).toBe(settle);
  });

  it('starts from a release velocity', () => {
    expect(springProgressAt(DOCK, 0.02, 20)).toBeGreaterThan(springProgressAt(DOCK, 0.02));
  });

  it('falls back on non-finite or non-positive inputs', () => {
    expect(Number.isFinite(springProgressAt({ response: Number.NaN, dampingRatio: -1 }, 0.1))).toBe(
      true,
    );
    expect(springPhysics({ response: 0, dampingRatio: 0 }).stiffness).toBeGreaterThan(0);
  });
});

describe('CSS', () => {
  it('samples the spring into linear() that stays within half a percent of it', () => {
    const css = motionCss(DOCK);
    const total = Number.parseFloat(css.duration);
    expect(total).toBe(springSettleMs(DOCK));
    const stops = css.easing
      .replace(/^linear\(|\)$/g, '')
      .split(',')
      .map(Number);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(1);
    expect(Math.max(...stops)).toBeGreaterThan(1.005);
    const at = (fraction: number) => {
      const position = fraction * (stops.length - 1);
      const index = Math.min(stops.length - 2, Math.floor(position));
      return stops[index]! + (stops[index + 1]! - stops[index]!) * (position - index);
    };
    for (let ms = 0; ms <= total; ms += 2)
      expect(Math.abs(at(ms / total) - springProgressAt(DOCK, ms / 1000))).toBeLessThan(0.005);
  });

  it('keeps a timing as its cubic-bezier, and reduced motion is instant', () => {
    expect(motionCss({ duration: 150, easing: [0.42, 0, 0.58, 1] })).toEqual({
      duration: '150ms',
      easing: 'cubic-bezier(0.42,0,0.58,1)',
    });
    expect(motionCss(DOCK, true).duration).toBe('0ms');
    expect(motionCss({ duration: Number.NaN }).duration).toBe('300ms');
  });

  it('reads a cubic-bezier like a browser', () => {
    expect(cubicBezierProgressAt([0, 0, 1, 1], 0.37)).toBeCloseTo(0.37, 5);
    expect(cubicBezierProgressAt([0.42, 0, 0.58, 1], 0.5)).toBeCloseTo(0.5, 5);
    const easeOut = cubicBezierProgressAt([0, 0, 0.58, 1], 0.25);
    expect(easeOut).toBeGreaterThan(0.25);
    expect(motionProgressAt({ duration: 0 }, 0)).toBe(1);
  });
});

describe('animateWithSpec', () => {
  it('drives a spring with its physics and a timing with its curve', () => {
    const value = shared(0);
    animateWithSpec(value, 1, DOCK);
    const physics = springPhysics(DOCK);
    expect(withSpring).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        mass: 1,
        stiffness: physics.stiffness,
        damping: physics.damping,
      }),
      undefined,
    );
    animateWithSpec(value, 0, { duration: 150, easing: [0.42, 0, 0.58, 1] });
    expect(withTiming).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ duration: 150, easing: { curve: [0.42, 0, 0.58, 1] } }),
      undefined,
    );
  });

  it('lands at once under reduced motion and still reports it', () => {
    const value = shared(0.3);
    const settled = jest.fn();
    animateWithSpec(value, 1, DOCK, true, settled);
    expect(value.value).toBe(1);
    expect(settled).toHaveBeenCalledWith(true);
    expect(withSpring).not.toHaveBeenCalled();
  });
});
