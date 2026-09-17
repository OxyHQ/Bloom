import { clamp, clamp01 } from '../styles/clamp';

/**
 * Five copies of `clamp` and three of `clamp01` existed. The copies agreed on
 * every ordinary input and disagreed on two edges; these pin both.
 */
describe('clamp', () => {
  it('holds a value inside the range and passes one already in it through', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  /**
   * RECONCILED, and load-bearing. `overlay/dropdown-placement.ts` inverts the
   * range exactly when a surface is larger than the viewport minus its gutters;
   * answering `min` pins it to the near gutter so its first rows stay
   * reachable. Two of the five copies answered `max`, which strands them.
   */
  it('resolves an inverted range to `min`, not `max`', () => {
    expect(clamp(5, 10, 0)).toBe(10);
    expect(clamp(-100, 10, 0)).toBe(10);
    expect(clamp(100, 10, 0)).toBe(10);
  });

  it('propagates a non-finite bound rather than inventing one', () => {
    expect(clamp(5, 0, Infinity)).toBe(5);
    expect(clamp(Infinity, 0, 10)).toBe(10);
    expect(clamp(-Infinity, 0, 10)).toBe(0);
  });
});

describe('clamp01', () => {
  it('holds a fraction inside 0..1', () => {
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(9)).toBe(1);
  });

  /**
   * `clamp01` answers 0 for an INFINITY too, where `clamp(v, 0, 1)` would
   * answer 1. A non-finite share means "not measured yet", and a full bar is
   * the wrong thing to draw for that.
   */
  it('answers 0 for an absent or non-finite value', () => {
    expect(clamp01(undefined)).toBe(0);
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(Infinity)).toBe(0);
    expect(clamp01(-Infinity)).toBe(0);
  });
});
