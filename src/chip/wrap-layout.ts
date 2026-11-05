/**
 * Pure line-fitting for `CappedChipRow`, kept out of the component so a gate can
 * walk it without rendering.
 *
 * The model is a greedy flex-wrap: pills sit left to right separated by `gap`,
 * and a pill that does not fit starts a new line. A row is `maxLines` at most.
 * The row only knows each pill's intrinsic width (measured by the component), so
 * this is the same arithmetic the browser runs when it wraps the same pills.
 */

export interface WrapFitInput {
  /** Intrinsic width of each pill, in the order it renders. */
  widths: readonly number[];
  /** Intrinsic width of the trailing "+N" pill. */
  moreWidth: number;
  /** Width the row has to wrap into. */
  available: number;
  gap: number;
  maxLines: number;
}

/** True when `widths`, wrapped greedily, stays within `maxLines`. */
export function fitsWithinLines(
  widths: readonly number[],
  available: number,
  gap: number,
  maxLines: number,
): boolean {
  let lines = 1;
  let cursor = 0;
  for (const width of widths) {
    if (cursor === 0) {
      cursor = width;
    } else if (cursor + gap + width <= available) {
      cursor += gap + width;
    } else {
      lines += 1;
      if (lines > maxLines) return false;
      cursor = width;
    }
  }
  return true;
}

/**
 * How many leading pills to show. Returns `widths.length` when every pill fits
 * on the allowed lines (no "+N" pill needed). Otherwise returns the largest
 * count `k` such that the first `k` pills followed by the "+N" pill still fit,
 * so the expander never gets pushed onto a line it cannot have.
 */
export function visibleChipCount({
  widths,
  moreWidth,
  available,
  gap,
  maxLines,
}: WrapFitInput): number {
  if (fitsWithinLines(widths, available, gap, maxLines)) return widths.length;
  for (let count = widths.length - 1; count >= 0; count -= 1) {
    const candidate = [...widths.slice(0, count), moreWidth];
    if (fitsWithinLines(candidate, available, gap, maxLines)) return count;
  }
  return 0;
}
