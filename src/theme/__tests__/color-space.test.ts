import { oklchToSrgb, srgbToRgbString, parseRgbString, deltaE } from '../color-space';

describe('color-space', () => {
  it('converts oklch white/black correctly', () => {
    expect(oklchToSrgb({ l: 1, c: 0, h: 0 })).toEqual({ r: 255, g: 255, b: 255 });
    expect(oklchToSrgb({ l: 0, c: 0, h: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('round-trips a known oxy purple within ΔE 1', () => {
    // hsl(277 66% 56%) === rgb(160 69 217) (current oracle)
    const rgb = oklchToSrgb({ l: 0.5783, c: 0.22, h: 309.31 });
    expect(deltaE(rgb, { r: 160, g: 69, b: 217 })).toBeLessThanOrEqual(1.0);
  });
  it('formats rgb as space-separated modern syntax', () => {
    expect(srgbToRgbString({ r: 31, g: 153, b: 239 })).toBe('rgb(31 153 239)');
    expect(srgbToRgbString({ r: 31, g: 153, b: 239 }, 0.1)).toBe('rgb(31 153 239 / 0.1)');
  });
  it('parses modern + legacy rgb strings', () => {
    expect(parseRgbString('rgb(31 153 239)')).toEqual({ r: 31, g: 153, b: 239 });
    expect(parseRgbString('rgb(31, 153, 239)')).toEqual({ r: 31, g: 153, b: 239 });
  });
});
