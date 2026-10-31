import { Platform } from 'react-native';
import {
  controlReliefScale,
  resolveSurfaceFill,
  resolveSurfaceOptics,
  resolveSurfaceTint,
} from '../surface/shared';
import { surfacePresenceStyle } from '../surface/use-surface-presence';

afterEach(() => jest.restoreAllMocks());

it('keeps opaque material backing independent of its parent', () => {
  expect(resolveSurfaceFill('#123456', '#ffffff')).toBe('#123456');
  expect(resolveSurfaceFill('#123456', '#000000')).toBe('#123456');
});
it('publishes explicit transparency against the actual backing', () => {
  expect(resolveSurfaceFill('rgba(255,255,255,0.25)', '#000000')).toBe('rgb(64, 64, 64)');
  expect(resolveSurfaceFill('transparent', '#123456')).toBe('#123456');
  expect(resolveSurfaceFill('rgba(255,255,255,0)', '#123456')).toBe('rgb(18, 52, 86)');
});

it('uses one subtle tint on the web and never compounds caller alpha', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  expect(resolveSurfaceTint('#123456')).toBe('rgba(18, 52, 86, 0.72)');
  expect(resolveSurfaceTint(resolveSurfaceTint('#123456'))).toBe('rgba(18, 52, 86, 0.72)');
  expect(resolveSurfaceTint('rgba(18,52,86,0.2)')).toBe('rgba(18,52,86,0.2)');
  expect(resolveSurfaceTint('transparent')).toBe('transparent');
});
it('keeps an opaque fill opaque on native, which has no blur beneath it', () => {
  expect(resolveSurfaceTint('#123456')).toBe('#123456');
});

describe('the native material', () => {
  // React Native reads a `boxShadow` string by its own parser: one value it
  // cannot read drops the whole shadow, silently. `calc()`/`var()` are never read.
  const LENGTH = '(-?\\d+(?:\\.\\d+)?)(?:px)?';
  const SHADOW = new RegExp(
    `^inset ${LENGTH} ${LENGTH} ${LENGTH}(?: ${LENGTH})? rgba\\((\\d+), (\\d+), (\\d+), (0(?:\\.\\d+)?|1)\\)$`,
  );

  it.each([false, true])(
    'paints continuous rim and directional body lighting as native-readable inset shadows (dark: %s)',
    (isDark) => {
      const { sheenShadow, rim } = resolveSurfaceOptics(isDark);
      const parse = (css: string) =>
        css.split(/,(?![^(]*\))/).map((part) => {
          expect(part).not.toMatch(/gradient|calc\(|var\(/);
          const match = part.trim().match(SHADOW);
          expect(match).not.toBeNull();
          if (!match) throw new Error(`Unsupported native shadow: ${part}`);
          const values = match.slice(1).map((value) => Number(value ?? 0));
          expect(values.every(Number.isFinite)).toBe(true);
          expect(values[2]).toBeGreaterThanOrEqual(0);
          for (const channel of values.slice(4, 7)) {
            expect(channel).toBeGreaterThanOrEqual(0);
            expect(channel).toBeLessThanOrEqual(255);
          }
          return values;
        });
      const rimLayers = parse(rim);
      const bodyLayers = parse(sheenShadow);
      // The perimeter exists on vertical sides as well as the horizontal edges.
      expect(
        rimLayers.some(
          ([x, y, blur, spread]) => x === 0 && y === 0 && blur === 0 && (spread ?? 0) > 0,
        ),
      ).toBe(true);
      // The shoulder and trough establish a direction, rather than mirrored white glows.
      expect(bodyLayers.some(([, y]) => (y ?? 0) > 0)).toBe(true);
      expect(bodyLayers.some(([, y]) => (y ?? 0) < 0)).toBe(true);
      expect(bodyLayers.some((values) => values.slice(4, 7).every((v) => v === 255))).toBe(true);
      expect(bodyLayers.some((values) => values.slice(4, 7).every((v) => v === 0))).toBe(true);
    },
  );

  it('leaves a fully present host without an opacity of its own', () => {
    expect(surfacePresenceStyle(1)).toEqual({});
    expect(surfacePresenceStyle(0.5)).toEqual({ opacity: 0.5 });
    expect(surfacePresenceStyle(0)).toEqual({ opacity: 0 });
  });

  it.each([
    [24, 16],
    [36, 20],
    [44, 22],
  ])(
    'keeps the full rim while confining control body lighting to content inset (%s/%s)',
    (height, lineHeight) => {
      const inset = (height - lineHeight) / 2;
      for (const dark of [false, true]) {
        const full = resolveSurfaceOptics(dark);
        const control = resolveSurfaceOptics(dark, controlReliefScale(height, lineHeight));
        expect(control.rim).toBe(full.rim);
        const layers = control.sheenShadow.split(/,(?![^(]*\))/);
        for (const layer of layers) {
          const parsed = layer.trim().match(SHADOW);
          expect(parsed).not.toBeNull();
          expect(Number(parsed?.[3])).toBeLessThanOrEqual(inset);
        }
      }
    },
  );
});
