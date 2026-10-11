import { Platform } from 'react-native';
import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';

const originalOS = Platform.OS;
afterEach(() => {
  Object.defineProperty(Platform, 'OS', {
    value: originalOS,
    configurable: true,
  });
});
function platform(os: string) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

describe('surface shapes', () => {
  it('uses web corner geometry without a native-only borderCurve', () => {
    platform('web');
    expect(surfaceStyle(SURFACE_SHAPES.card)).toEqual({
      borderRadius: 20,
      cornerShape: 'round',
    });
    expect(surfaceStyle({ radius: 9999, curve: 'round' })).toEqual({
      borderRadius: 9999,
      cornerShape: 'round',
    });
  });
  it('uses iOS continuous curves and keeps Android circular', () => {
    platform('ios');
    expect(surfaceStyle({ radius: 20, curve: 'smooth' })).toEqual({
      borderRadius: 20,
      borderCurve: 'continuous',
    });
    platform('android');
    expect(surfaceStyle({ radius: 20, curve: 'smooth' })).toEqual({
      borderRadius: 20,
    });
  });
  it('preserves logical corners and explicitly squares omitted corners', () => {
    platform('android');
    expect(surfaceStyle(SURFACE_SHAPES.sheet)).toEqual({
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    });
  });
  it('mirrors asymmetric corners explicitly on both renderers', () => {
    platform('web');
    expect(surfaceStyle({ radius: { topStart: 12, bottomEnd: 4 } }, 'rtl')).toMatchObject({
      borderTopLeftRadius: 0,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 0,
    });
  });
  it('does not overwrite a separately owned or animated radius', () => {
    platform('web');
    expect(surfaceStyle({ curve: 'smooth' })).toEqual({
      cornerShape: 'squircle',
    });
  });
  it.each([-1, NaN, Infinity, -Infinity])('rejects invalid radius %s', (radius) => {
    expect(() => surfaceStyle({ radius })).toThrow(RangeError);
    expect(() => surfaceStyle({ radius: { topEnd: radius } })).toThrow(RangeError);
  });
  it('permits zero and fractional radii without rounding to device pixels', () => {
    platform('android');
    expect(surfaceStyle({ radius: 0 })).toEqual({ borderRadius: 0 });
    expect(surfaceStyle({ radius: 0.5 })).toEqual({ borderRadius: 0.5 });
  });
});
