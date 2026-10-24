import { Platform } from 'react-native';
import { resolveSurfaceFill, resolveSurfaceOptics, resolveSurfaceTint } from '../surface/shared';
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
    `^inset 0 ${LENGTH} ${LENGTH}(?: ${LENGTH})? rgba\\(255, 255, 255, (0(?:\\.\\d+)?|1)\\)$`,
  );

  it.each([false, true])(
    'paints its sheen as inset shadows, never a gradient (dark: %s)',
    (isDark) => {
      const { sheenShadow, rim } = resolveSurfaceOptics(isDark);
      for (const css of [sheenShadow, rim]) {
        expect(css).not.toMatch(/gradient|calc\(|var\(/);
        for (const layer of css.split(/,(?![^(]*\))/).map((part) => part.trim()))
          expect(layer).toMatch(SHADOW);
      }
      const [top, bottom] = sheenShadow
        .split(/,(?![^(]*\))/)
        .map((part) => part.trim().match(SHADOW));
      expect(Number(top?.[1])).toBeGreaterThan(0);
      expect(Number(bottom?.[1])).toBe(-Number(top?.[1]));
      // A spread of minus the blur keeps the glow off the sides.
      expect(Number(top?.[3])).toBe(-Number(top?.[2]));
    },
  );

  it('leaves a fully present host without an opacity of its own', () => {
    expect(surfacePresenceStyle(1)).toEqual({});
    expect(surfacePresenceStyle(0.5)).toEqual({ opacity: 0.5 });
    expect(surfacePresenceStyle(0)).toEqual({ opacity: 0 });
  });
});
