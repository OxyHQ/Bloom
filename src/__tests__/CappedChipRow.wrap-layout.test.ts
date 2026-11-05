/**
 * `visibleChipCount`: how many pills fit on the allowed lines, with room kept
 * for the trailing "+N" pill. Pure arithmetic, so it is pinned here directly.
 */
import { fitsWithinLines, visibleChipCount } from '../chip/wrap-layout';

describe('fitsWithinLines', () => {
  it('fits pills that share a line', () => {
    expect(fitsWithinLines([40, 40], 100, 8, 1)).toBe(true);
  });

  it('starts a new line when a pill does not fit', () => {
    expect(fitsWithinLines([60, 60], 100, 8, 1)).toBe(false);
    expect(fitsWithinLines([60, 60], 100, 8, 2)).toBe(true);
  });
});

describe('visibleChipCount', () => {
  const gap = 8;

  it('shows every pill when they all fit on the allowed lines', () => {
    expect(
      visibleChipCount({ widths: [30, 30, 30], moreWidth: 30, available: 300, gap, maxLines: 2 }),
    ).toBe(3);
  });

  it('keeps room on the last line for the "+N" pill', () => {
    // Two lines of 100px: [60] / [60] fills line 2, so the "+N" pill (40px)
    // cannot follow the second 60px pill and must replace it.
    expect(
      visibleChipCount({
        widths: [60, 60, 60, 60],
        moreWidth: 40,
        available: 100,
        gap,
        maxLines: 2,
      }),
    ).toBe(1);
  });

  it('keeps a pill wider than the row alone on its line, as a browser does', () => {
    expect(
      visibleChipCount({ widths: [200], moreWidth: 40, available: 100, gap, maxLines: 1 }),
    ).toBe(1);
  });

  it('returns 0 when no pill fits beside the "+N" pill', () => {
    expect(
      visibleChipCount({
        widths: [200, 200],
        moreWidth: 40,
        available: 100,
        gap,
        maxLines: 1,
      }),
    ).toBe(0);
  });
});
