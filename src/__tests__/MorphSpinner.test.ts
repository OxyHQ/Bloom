import { POINTS_PER_FRAME, STEPS_PER_SEGMENT } from '../loading/morph/const';
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
