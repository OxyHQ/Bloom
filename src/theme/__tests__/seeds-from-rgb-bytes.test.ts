import { argbFromRgb, seedsFromImagePixels, seedsFromRgbBytes } from '../color-engine';

/** 16 pixels: three quarters orange, a quarter deep blue. */
const RGB = [
  ...Array.from({ length: 12 }, () => [0xe7, 0x6f, 0x51]),
  ...Array.from({ length: 4 }, () => [0x1d, 0x35, 0x57]),
];
const PIXELS = RGB.map(([red = 0, green = 0, blue = 0]) => argbFromRgb(red, green, blue));

describe('seedsFromRgbBytes', () => {
  it('ranks the same seeds as the packed pixels it stands for', () => {
    const bytes = Uint8Array.from(RGB.flat());
    expect(seedsFromRgbBytes(bytes)).toEqual(seedsFromImagePixels(PIXELS));
  });

  it('skips the alpha byte of a four-channel buffer', () => {
    const rgba = Uint8Array.from(RGB.flatMap((pixel) => [...pixel, 0x80]));
    expect(seedsFromRgbBytes(rgba, 4)).toEqual(seedsFromImagePixels(PIXELS));
  });

  it('ignores trailing bytes that do not make a whole pixel', () => {
    const ragged = Uint8Array.from([...RGB.flat(), 0xff, 0x00]);
    expect(seedsFromRgbBytes(ragged)).toEqual(seedsFromImagePixels(PIXELS));
  });

  it('passes scoring options through', () => {
    expect(seedsFromRgbBytes(Uint8Array.from(RGB.flat()), 3, { desired: 1 })).toHaveLength(1);
  });
});
