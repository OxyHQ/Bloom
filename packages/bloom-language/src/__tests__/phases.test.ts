import { Text } from '../primitives';
import { defineKeyframes } from '../motion/keyframes';
import { phaseKeyframes } from '../motion/phases';
import { resolveSpace } from '../tokens';

type Frames = readonly { at: number; translateY?: number; scale?: number; opacity?: number }[];
const framesOf = (value: unknown) => (value as { source: Frames }).source;

describe('keyframe tracks', () => {
  it('a linear track is sampled from its rest to its value over its length', () => {
    const frames = framesOf(defineKeyframes({ scale: [{ to: 2, ms: 100 }] }));
    expect(frames[0]).toMatchObject({ at: 0, scale: 1 });
    expect(frames[frames.length - 1]).toMatchObject({ at: 1, scale: 2 });
    expect(frames.find((frame) => frame.at === 0.5)?.scale).toBeCloseTo(1.5);
  });

  it('tracks keep their own timings: the shorter one rests at its last value', () => {
    const value = defineKeyframes({
      y: [{ to: '-lg', ms: 100 }],
      scale: [
        { to: 1.2, ms: 100 },
        { to: 1, ms: 100 },
      ],
    });
    const frames = framesOf(value);
    expect(frames.find((frame) => frame.at === 0.5)).toMatchObject({
      translateY: -resolveSpace('lg'),
      scale: 1.2,
    });
    expect(frames[frames.length - 1]).toMatchObject({ translateY: -resolveSpace('lg'), scale: 1 });
  });
});

describe('phases', () => {
  it('a phase animation goes through every phase and back to the first', () => {
    const frames = framesOf(phaseKeyframes([{}, { y: -8, scale: 1.2 }], ['select', 'pop']));
    expect(frames[0]).toMatchObject({ at: 0, translateY: 0, scale: 1 });
    expect(frames[frames.length - 1]?.translateY).toBeCloseTo(0);
    expect(Math.min(...frames.map((frame) => frame.translateY ?? 0))).toBeCloseTo(-8, 0);
  });

  it('the same phases are one keyframes value', () => {
    const lift = (n: number) =>
      Text('a').phases(['rest', 'lift'] as const, n, (v, phase) =>
        v.scale(phase === 'lift' ? 'swell' : 'full'),
      );
    const a = lift(1).modifiers.find((m) => m.kind === 'keyframes');
    const b = lift(2).modifiers.find((m) => m.kind === 'keyframes');
    expect(a && 'value' in a ? a.value : undefined).toBe(b && 'value' in b ? b.value : undefined);
    // The view rests in the first phase.
    expect(lift(1).modifiers.some((m) => m.kind === 'scale')).toBe(true);
  });
});
