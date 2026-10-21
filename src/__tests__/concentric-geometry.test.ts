import { resolveConcentricCorners } from '../concentric';

it('subtracts the smaller adjacent inset, clamps tight corners, and expands negative margins', () => {
  expect(
    resolveConcentricCorners(
      { topLeft: 20, topRight: 12, bottomRight: 4, bottomLeft: 0 },
      { top: 8, right: 16, bottom: -2, left: 10 },
    ),
  ).toEqual({ topLeft: 12, topRight: 4, bottomRight: 6, bottomLeft: 2 });
  expect(
    resolveConcentricCorners(
      { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
      { top: 10, right: 10, bottom: 10, left: 10 },
    ),
  ).toEqual({ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 });
});

it('keeps pill radii and refuses non-finite geometry', () => {
  const pill = { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999 };
  const gap = { top: 8, right: 8, bottom: 8, left: 8 };
  expect(resolveConcentricCorners(pill, gap)).toEqual(pill);
  expect(() => resolveConcentricCorners({ ...pill, topLeft: -1 }, gap)).toThrow(RangeError);
  expect(() => resolveConcentricCorners(pill, { ...gap, left: NaN })).toThrow(RangeError);
});
