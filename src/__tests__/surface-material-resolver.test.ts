import { Platform } from 'react-native';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { resolveSurfaceGeometry } from '../surface/resolve-surface-geometry';

afterEach(() => jest.restoreAllMocks());

it('resolves paint, backing, CSS and depth as one decision', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const outer = resolveSurfaceMaterial({ fill: '#ffffff', parentFill: '#000000', parentLevel: 2 });
  expect(outer.paintFill).toBe('rgba(255, 255, 255, 0.72)');
  expect(outer.publishedFill).toBe('rgb(184, 184, 184)');
  expect(outer.vars).toEqual({ '--bloom-surface': 'rgb(184, 184, 184)' });
  expect(outer.level).toBe(3);
  const nested = resolveSurfaceMaterial({
    fill: '#000000',
    parentFill: outer.publishedFill,
    parentLevel: outer.level,
  });
  expect(nested.level).toBe(3);
  expect(nested.publishedFill).toBe('rgb(52, 52, 52)');
});
it('paints and publishes an opaque fill as-is on native, with no CSS props', () => {
  expect(
    resolveSurfaceMaterial({ fill: '#ffffff', parentFill: '#000000', parentLevel: 2 }),
  ).toMatchObject({ paintFill: '#ffffff', publishedFill: '#ffffff', vars: undefined, level: 3 });
});
it('preserves explicit alpha and keeps plain/backing hosts out of the depth ladder', () => {
  const material = resolveSurfaceMaterial({
    fill: 'rgba(255,255,255,.5)',
    parentFill: '#000000',
    parentLevel: 1,
  });
  expect(material.paintFill).toBe('rgba(255,255,255,.5)');
  expect(material.publishedFill).toBe('rgb(128, 128, 128)');
  const plain = resolveSurfaceMaterial({
    fill: '#ffffff',
    parentFill: '#000000',
    parentLevel: 1,
    paint: false,
  });
  expect(plain).toMatchObject({
    paintFill: '#ffffff',
    publishedFill: '#ffffff',
    level: 1,
    painted: false,
  });
  expect(
    resolveSurfaceMaterial({ fill: 'transparent', parentFill: '#123456', parentLevel: 2 }),
  ).toMatchObject({ painted: false, publishedFill: '#123456', level: 2 });
});
it('resets portal depth explicitly without losing the actual fill', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  expect(
    resolveSurfaceMaterial({ fill: '#ffffff', parentFill: '#000000', parentLevel: 3, level: 0 }),
  ).toMatchObject({ level: 0, publishedFill: 'rgb(184, 184, 184)' });
});
it('uses explicit geometry, then caller style, then the family default for paint and host', () => {
  expect(resolveSurfaceGeometry(20, { borderRadius: 8 }, 12, 'smooth')).toMatchObject({
    radius: 20,
    shape: { radius: 20, curve: 'smooth' },
    style: { borderRadius: 20 },
  });
  expect(resolveSurfaceGeometry(undefined, [{ borderRadius: 8 }], 12, 'round').radius).toBe(8);
  expect(resolveSurfaceGeometry(undefined, undefined, 12, 'smooth').radius).toBe(12);
  expect(resolveSurfaceGeometry(undefined, { borderRadius: '50%' }, 12, 'round')).toMatchObject({
    radius: '50%',
    style: { borderRadius: '50%' },
  });
});
