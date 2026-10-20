/** Fit a suffix of ancestors; the active page always retains readable space. */
export function collapsedAncestorCount(
  widths: readonly number[],
  available: number,
  trigger: number,
  between: number,
): number {
  if (widths.length < 2) return 0;
  if (widths.some((width) => width <= 0) || available <= 0) return widths.length - 1;
  const fullWidth = widths.reduce((sum, width) => sum + width, 0) + between * (widths.length - 1);
  if (fullWidth <= available) return 0;
  const current = Math.min(widths[widths.length - 1] ?? 0, Math.max(64, available * 0.4));
  let remaining = available - trigger - between - current;
  let hidden = widths.length - 1;
  for (let index = widths.length - 2; index >= 0; index--) {
    const cost = (widths[index] ?? 0) + between;
    if (cost > remaining) break;
    remaining -= cost;
    hidden--;
  }
  return hidden;
}
