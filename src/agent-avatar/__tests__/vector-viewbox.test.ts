import portraits from '../../../templates/agents/avatar-portraits.json';
import { VECTOR_AVATAR_VIEWBOX, VECTOR_CANVAS_VIEWBOX, avatarViewBox } from '../vector-viewbox';

const [x, y, side] = VECTOR_AVATAR_VIEWBOX.split(' ').map(Number) as [number, number, number];

describe('the window an avatar is drawn through', () => {
  it('crops the authored canvas, and leaves a frame that fits its own bounds alone', () => {
    expect(avatarViewBox(VECTOR_CANVAS_VIEWBOX)).toBe(VECTOR_AVATAR_VIEWBOX);
    expect(avatarViewBox('10 20 30 30')).toBe('10 20 30 30');
  });

  it('is square, and holds every character at rest', () => {
    const frames = portraits as Record<string, { paths: { d: string }[] }>;
    for (const [id, frame] of Object.entries(frames)) {
      const numbers = frame.paths.flatMap((path) => path.d.match(/-?\d+\.?\d*/g)!.map(Number));
      const xs = numbers.filter((_, i) => i % 2 === 0);
      const ys = numbers.filter((_, i) => i % 2 === 1);
      const inside = [
        Math.min(...xs) >= x,
        Math.max(...xs) <= x + side,
        Math.min(...ys) >= y,
        Math.max(...ys) <= y + side,
      ];
      expect({ id, inside }).toEqual({ id, inside: [true, true, true, true] });
    }
  });

  it('fills most of the box: a typical character spans at least 75% of the window', () => {
    // Drawn through the whole 320 canvas it was 174/320, about 54%.
    expect(174 / side).toBeGreaterThan(0.75);
  });
});
