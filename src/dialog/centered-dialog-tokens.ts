import { borderRadius, space } from '../styles/tokens';

/**
 * Shared layout constants for `<CenteredDialog>`, kept in one module so the
 * native and web forks render identically. All values are Bloom theme tokens
 * (`styles/tokens`) — no ad-hoc magic numbers.
 *
 * COMPACT is the priority: the `compact` spacing set is the default and is
 * deliberately tight (≈`space.md`), so the card reads snug out of the box.
 * The `cozy` set is the opt-out (`compact={false}`) for roomier dialogs.
 */

/** Default max card width — comfortable for a compact dialog. */
export const DEFAULT_MAX_WIDTH = 440;

/** Card height is capped at this fraction of the viewport; body scrolls. */
export const MAX_HEIGHT_FRACTION = 0.8;

/** Card corner radius (token: `borderRadius.lg` = 16). */
export const CARD_RADIUS = borderRadius.lg;

/** Outer gutter between the card edge and the viewport edge (token `space.lg`). */
export const VIEWPORT_GUTTER = space.lg;

export type DialogSpacing = {
  /** Card inner padding (horizontal + vertical). */
  pad: number;
  /** Gap between the header title row and the body. */
  headerGap: number;
  /** Gap between the body and the footer. */
  footerGap: number;
  /** Vertical gap between stacked body items (the content container `gap`). */
  contentGap: number;
};

/**
 * Compact (default) — tight, snug spacing built on `space.md` (12).
 *
 *   pad        = space.md  (12)
 *   headerGap  = space.sm  (8)
 *   footerGap  = space.md  (12)
 *   contentGap = space.sm  (8)
 */
export const COMPACT_SPACING: DialogSpacing = {
  pad: space.md,
  headerGap: space.sm,
  footerGap: space.md,
  contentGap: space.sm,
};

/**
 * Cozy (`compact={false}`) — roomier spacing built on `space.xl` (20).
 *
 *   pad        = space.xl   (20)
 *   headerGap  = space.md   (12)
 *   footerGap  = space.lg   (16)
 *   contentGap = space.md   (12)
 */
export const COZY_SPACING: DialogSpacing = {
  pad: space.xl,
  headerGap: space.md,
  footerGap: space.lg,
  contentGap: space.md,
};

export function resolveSpacing(compact: boolean): DialogSpacing {
  return compact ? COMPACT_SPACING : COZY_SPACING;
}
