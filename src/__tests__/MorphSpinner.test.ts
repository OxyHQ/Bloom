import { POINTS_PER_FRAME, STEPS_PER_SEGMENT } from '../loading/morph/constants';
import { getMorphFrames, morphPathD } from '../loading/morph/frames';

describe('morphing spinner frames', () => {
  const { flat, frameCount } = getMorphFrames();

  it('builds one frame per step of every shape in the loop', () => {
    expect(frameCount).toBe(7 * STEPS_PER_SEGMENT);
    expect(flat).toHaveLength(frameCount * POINTS_PER_FRAME * 2);
  });

  it('keeps every point finite and inside the 100-unit box', () => {
    for (const v of flat) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(105);
    }
  });

  it('blends two frames into one closed path with a point per sample', () => {
    const d = morphPathD(flat, frameCount, 3.5);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/[ML]/g)).toHaveLength(POINTS_PER_FRAME);
  });

  it('wraps from the last frame back to the first', () => {
    expect(() => morphPathD(flat, frameCount, frameCount - 0.5)).not.toThrow();
  });
});

describe('morph outline sampling', () => {
  const { flat, frameCount } = getMorphFrames();

  it('spaces the points of every frame evenly along the outline', () => {
    let worst = 0;
    for (let f = 0; f < frameCount; f++) {
      const gaps: number[] = [];
      const base = f * POINTS_PER_FRAME * 2;
      for (let k = 0; k < POINTS_PER_FRAME; k++) {
        const next = (k + 1) % POINTS_PER_FRAME;
        gaps.push(
          Math.hypot(
            flat[base + next * 2]! - flat[base + k * 2]!,
            flat[base + next * 2 + 1]! - flat[base + k * 2 + 1]!,
          ),
        );
      }
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      worst = Math.max(worst, Math.max(...gaps) / mean);
    }
    // Chords across a tight corner are shorter than the arc they span, so a little
    // spread is real; samples in the wrong unit spread by whole multiples.
    expect(worst).toBeLessThan(1.6);
  });
});
