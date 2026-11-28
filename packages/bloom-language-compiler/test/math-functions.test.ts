/**
 * Foundation's math in `Bloom.Math` (`cbrt`, `atan`, `atan2`, the hyperbolic functions, …): the
 * same doubles as JS's `Math`, which the other backends match through fdlibm.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/MathFunctions.bloom') as {
  cubeRoots: (xs: number[]) => number[];
  angles: (y: number, x: number) => number[];
  hyperbolic: (x: number) => number[];
  nearZero: (x: number) => number[];
  remainders: (x: number, y: number) => number[];
};

it('gives Math.cbrt, negative roots included', () => {
  const xs = [27, -8, 0.001, 2, 1e-300];
  expect(m.cubeRoots(xs)).toEqual(xs.map(Math.cbrt));
  expect(m.cubeRoots([-27])).toEqual([-3]);
});

it('gives the inverse and hyperbolic functions', () => {
  expect(m.angles(1, -2)).toEqual([
    Math.atan(-0.5),
    Math.atan2(1, -2),
    Math.asin(0.5),
    Math.acos(0.5),
  ]);
  const x = 0.75;
  expect(m.hyperbolic(x)).toEqual([
    Math.sinh(x),
    Math.cosh(x),
    Math.tanh(x),
    Math.asinh(x),
    Math.acosh(x + 1),
    Math.atanh(x / 2),
  ]);
  expect(m.nearZero(1e-10)).toEqual([
    2 ** 1e-10,
    Math.expm1(1e-10),
    Math.log1p(1e-10),
    Math.trunc(-1e-9),
  ]);
  expect(m.remainders(-7.5, 2)).toEqual([-1.5, -1.5]);
});
