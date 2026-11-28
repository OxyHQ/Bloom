/** Swift's `break` and `continue`: loops left and continued, by name too, and a case's `break`. */

// Required, not imported: see bloom.cost.test.tsx.
const { firstKeys, pairs, countdown, kept } = require('./bloom/break-continue.bloom') as {
  firstKeys: (xs: (string | undefined)[]) => string[];
  pairs: (grid: number[][], target: number) => number;
  countdown: (n: number) => number;
  kept: (kinds: ('skip' | 'stop' | 'keep')[]) => number;
};

it('continues past an absent key and stops after four', () => {
  expect(firstKeys(['a', undefined, 'b', 'c', 'd', 'e', 'f'])).toEqual(['a', 'b', 'c', 'd']);
});

it('leaves and continues the named outer loop', () => {
  expect(
    pairs(
      [
        [1, -1, 7],
        [2, 7, 9],
      ],
      7,
    ),
  ).toBe(7);
  expect(pairs([[-1, 7], [3]], 7)).toBe(0);
});

it('continues a while loop', () => {
  expect(countdown(6)).toBe(3);
});

it("leaves the switch, not the loop, on a case's break", () => {
  expect(kept(['skip', 'skip', 'keep', 'stop', 'keep'])).toBe(100 + 1 + 1000 + 1);
});
