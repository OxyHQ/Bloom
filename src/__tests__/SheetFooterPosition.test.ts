import { sheetFooterOffset } from '../bottom-sheet/footer-position';

it('pins the footer to the viewport edge while compensating the panel scale', () => {
  const panel = 600,
    footer = 56,
    scale = 0.98,
    travel = 200;
  const offset = sheetFooterOffset(travel, scale, panel, footer);
  const resultingBottom = travel - ((1 - scale) * panel) / 2 + scale * offset;
  expect(resultingBottom).toBeCloseTo(0);
});
it('keeps the footer inside the panel once the panel top reaches it', () => {
  expect(sheetFooterOffset(800, 0.95, 600, 56)).toBe(-544);
  expect(sheetFooterOffset(800, 0.95, 40, 56)).toBe(0);
});
it('does not counteract upward overscroll or unmeasured layout', () => {
  expect(sheetFooterOffset(-20, 1, 600, 56)).toBe(0);
  expect(sheetFooterOffset(20, 1, 600, 0)).toBe(0);
  expect(sheetFooterOffset(20, 1, 0, 56)).toBe(0);
});
