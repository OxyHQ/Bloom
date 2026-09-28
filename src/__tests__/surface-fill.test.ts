import { resolveSurfaceFill, resolveSurfaceTint } from '../surface/shared';

it('keeps opaque material backing independent of its parent', () => {
  expect(resolveSurfaceFill('#123456', '#ffffff')).toBe('#123456');
  expect(resolveSurfaceFill('#123456', '#000000')).toBe('#123456');
});
it('publishes explicit transparency against the actual backing', () => {
  expect(resolveSurfaceFill('rgba(255,255,255,0.25)', '#000000')).toBe('rgb(64, 64, 64)');
  expect(resolveSurfaceFill('transparent', '#123456')).toBe('#123456');
  expect(resolveSurfaceFill('rgba(255,255,255,0)', '#123456')).toBe('rgb(18, 52, 86)');
});

it('uses one subtle tint and never compounds caller alpha', () => {
  expect(resolveSurfaceTint('#123456')).toBe('rgba(18, 52, 86, 0.9)');
  expect(resolveSurfaceTint(resolveSurfaceTint('#123456'))).toBe('rgba(18, 52, 86, 0.9)');
  expect(resolveSurfaceTint('rgba(18,52,86,0.2)')).toBe('rgba(18,52,86,0.2)');
  expect(resolveSurfaceTint('transparent')).toBe('transparent');
});
