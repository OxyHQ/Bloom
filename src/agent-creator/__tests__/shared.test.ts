import { FOLD_SHAPES } from '../../agent-avatar/model';
import {
  avatarHex,
  hexAppearance,
  hexToHsv,
  hsvToHex,
  normalizeAgentPreferences,
  shapeArcPoint,
  wrapShape,
} from '../shared';

describe('agent appearance color round trips', () => {
  it.each(['#000000', '#ffffff', '#437ef7', '#27b5a2', '#e34798', '#7f7f7f'])(
    'preserves %s through the editor and avatar model',
    (hex) => {
      const appearance = hexAppearance(hex)!;
      expect(
        avatarHex({
          hue: appearance.hue!,
          saturation: appearance.saturation!,
          lightness: appearance.lightness,
        }),
      ).toBe(hex);
      expect(hsvToHex(hexToHsv(hex)!)).toBe(hex);
    },
  );
  it('switches dark custom fills to light eyes and rejects incomplete input', () => {
    expect(hexAppearance('#111111')?.lightEyes).toBe(true);
    expect(hexAppearance('#eeeeee')?.lightEyes).toBe(false);
    expect(hexAppearance('#ff')).toBeNull();
    expect(hexAppearance('#gggggg')).toBeNull();
    expect(hexToHsv('invalid')).toBeNull();
  });
  it('retains hue when a controlled picker reaches black or gray', () => {
    const color = { h: 259, s: 0.75, v: 0 };
    expect(hsvToHex(color)).toBe('#000000');
    expect(hsvToHex({ ...color, v: 1 })).toBe('#7c40ff');
  });
});

describe('agent preference restoration', () => {
  it('keeps valid selections, including voice off and notifications off', () => {
    expect(
      normalizeAgentPreferences({
        voice: '',
        speed: 0.75,
        language: 'es',
        notifications: false,
      }),
    ).toEqual({ voice: '', speed: 0.75, language: 'es', notifications: false });
  });
  it('bounds untrusted preference values before use by speech providers', () => {
    expect(
      normalizeAgentPreferences({
        voice: 'x'.repeat(250),
        speed: Infinity,
        language: 'unsupported',
        notifications: 'yes',
      } as never),
    ).toEqual({
      voice: 'x'.repeat(200),
      speed: 1,
      language: 'auto',
      notifications: true,
    });
    expect(normalizeAgentPreferences(null)).toEqual({
      voice: 'alice',
      speed: 1,
      language: 'auto',
      notifications: true,
    });
  });
});

describe('shape track', () => {
  it('wraps backwards and across multiple full rotations', () => {
    expect(wrapShape(-1)).toBe(FOLD_SHAPES.length - 1);
    expect(wrapShape(FOLD_SHAPES.length * 3 + 2)).toBe(2);
  });
  it('keeps the source 210px radius and mirror symmetry', () => {
    expect(shapeArcPoint(0)).toEqual({ x: 0, y: 34 });
    const left = shapeArcPoint(-2),
      right = shapeArcPoint(2);
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.y).toBeCloseTo(right.y);
    expect(Math.hypot(right.x, right.y + 176)).toBeCloseTo(210);
  });
});
