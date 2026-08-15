/**
 * The shared layer `dropdown-menu`, `context-menu`, `menubar`, `popover` and
 * `select` sit on: one trigger slot, one panel, one row vocabulary, one anchor
 * measurement, instead of five copies.
 *
 * INTERNAL. This barrel is the family's surface to the five families INSIDE
 * Bloom that build on it — it is deliberately absent from `package.json#exports`
 * and from `src/index.ts`, and `family-layout.test.ts` records that in
 * `INTERNAL_DIRECTORIES`. Nothing here is public API, and a consumer reaching
 * `@oxyhq/bloom/floating` is a bug in the export map, not a supported import.
 */
export { VIEWPORT_GUTTER, DEFAULT_SIDE_OFFSET, DEFAULT_ALIGN_OFFSET, MENU_MIN_WIDTH } from './constants';
export {
  MenuSurfaceProvider,
  useMenuSurface,
  MenuRadioGroupProvider,
  useMenuRadioGroup,
  MenuSubProvider,
  useMenuSub,
} from './context';
export type {
  MenuSurfaceContextValue,
  MenuRadioGroupContextValue,
  MenuSubContextValue,
} from './context';
export { FloatingPanel } from './FloatingPanel';
export { createMenuRows } from './menu-rows';
export { TriggerSlot } from './TriggerSlot';
export type { TriggerSlotProps } from './TriggerSlot';
export { useAnchorRect } from './use-anchor-rect';
export { useSheetOpenBridge } from './use-sheet-open-bridge';
export type { SheetOpenBridge } from './use-sheet-open-bridge';
export type * from './types';
