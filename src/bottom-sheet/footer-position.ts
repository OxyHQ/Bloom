/** Counteract downward sheet travel, until the footer reaches the panel's top edge. */
export function sheetFooterOffset(
  translation: number,
  scale: number,
  panelHeight: number,
  footerHeight: number,
): number {
  'worklet';
  if (translation <= 0 || scale <= 0 || panelHeight <= footerHeight || footerHeight <= 0) return 0;
  // Sheet scale is around its centre; subtract the bottom edge's scale displacement.
  const travel = Math.max(0, translation - ((1 - scale) * panelHeight) / 2);
  return -Math.min(travel / scale, Math.max(0, panelHeight - footerHeight));
}
