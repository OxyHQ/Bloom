// The math externs' reference: each function of stdlib/Bloom/Math.bloom over edge values and 20000
// seeded random inputs, as V8's `Math` computes it (run with node, not bun: JavaScriptCore differs in
// the last bit). One line per call: `name inputBits resultBits`, the doubles' raw bits.
import { writeFileSync } from 'node:fs';

const f = new Float64Array(1);
const u = new BigUint64Array(f.buffer);
const bits = (x) => {
  f[0] = x;
  return u[0].toString();
};
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const xs = [0, -0, 1, -1, 0.5, -0.5, 2, -2, 1e-300, -1e-300, 5e-324, 1e-10, 3e8, -3e8, 1e300, Infinity, -Infinity, NaN, 0.9999999999, 1.0000001, 27, -8, 2.7, -2.7, 1024, 0.125];
for (let i = 0; i < 20000; i++) {
  const k = rnd();
  xs.push((rnd() - 0.5) * 10 ** (Math.floor(k * 12) - 6));
}
const a = Math.abs;
// Each as MathConformance.kt calls it: arguments brought into the function's domain.
const fns = {
  sqrt: (x) => Math.sqrt(a(x)), cbrt: Math.cbrt, pow: (x) => Math.pow(a(x), 1.37), exp: Math.exp,
  log: (x) => Math.log(a(x)), log2: (x) => Math.log2(a(x)), log10: (x) => Math.log10(a(x)),
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: (x) => Math.asin(x / (1 + a(x))), acos: (x) => Math.acos(x / (1 + a(x))), atan: Math.atan,
  atan2: (x) => Math.atan2(x, 0.3), hypot: (x) => Math.hypot(x, 0.3),
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh,
  acosh: (x) => Math.acosh(a(x) + 1), atanh: (x) => Math.atanh(x / (1 + a(x))),
  exp2: (x) => 2 ** x, expm1: Math.expm1, log1p: (x) => Math.log1p(a(x)), trunc: Math.trunc,
  fmod: (x) => x % 0.7,
};
const out = [];
for (const x of xs) for (const [name, g] of Object.entries(fns)) out.push(`${name} ${bits(x)} ${bits(g(x))}`);
writeFileSync(process.argv[2], `${out.join('\n')}\n`);
