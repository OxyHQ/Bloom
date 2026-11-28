/**
 * `Int`'s bit and overflow operators (`& | ^ ~ << >>`, `&+ &- &*`, and `&= |= ^= <<= >>=`),
 * Swift's, with 64-bit two's complement semantics: exact on the JS backend while a result is
 * within ±(2^53 − 1), where an `Int` is exact there.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/IntBits.bloom') as {
  pack: (a: number, r: number, g: number, b: number) => number;
  unpack: (argb: number) => number[];
  ops: (a: number, b: number) => number[];
  fnv32: (bytes: number[]) => number;
};

const big = (f: (a: bigint, b: bigint) => bigint, a: number, b: number) =>
  Number(BigInt.asIntN(64, f(BigInt(a), BigInt(b))));

it('packs and unpacks ARGB past 32 bits', () => {
  const argb = m.pack(255, 18, 52, 86);
  expect(argb).toBe(0xff123456);
  expect(m.unpack(argb)).toEqual([255, 18, 52, 86]);
});

it('gives the 64-bit results, small and large', () => {
  for (const [a, b] of [
    [12, 10],
    [-7, 3],
    [2 ** 40 + 5, 2 ** 33 + 1],
    [-(2 ** 45), 2 ** 44 - 1],
  ] as const) {
    const [and, or, xor, not, shl, shr, wadd, wsub, wmul] = m.ops(a, b);
    expect(and).toBe(big((x, y) => x & y, a, b));
    expect(or).toBe(big((x, y) => x | y, a, b));
    expect(xor).toBe(big((x, y) => x ^ y, a, b));
    expect(not).toBe(-a - 1);
    expect(shl).toBe(big((x) => x << 3n, a, b));
    expect(shr).toBe(big((x) => x >> 1n, a, b));
    expect(wadd).toBe(a + b);
    expect(wsub).toBe(a - b);
    if (Number.isSafeInteger(a * b)) expect(wmul).toBe(a * b);
  }
  const out = m.ops(12, 10);
  expect(out[9]).toBe(((((12 ^ 10) & 0xffff) | 1) << 2) >> 1);
  expect(out[10]).toBe(2 ** 40);
  expect(out[11]).toBe(-4);
});

it('hashes with a wrapping multiply', () => {
  const bytes = [...'hello'].map((c) => c.charCodeAt(0));
  let h = 0x811c9dc5;
  for (const byte of bytes) h = Math.imul(h ^ byte, 16777619) >>> 0;
  expect(m.fnv32(bytes)).toBe(h);
});
