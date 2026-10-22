import { useBloomAppearance } from '../appearance';
import { createContext, useContext } from 'react';

import type { TypeScaleVariant } from '../typography/scale';
import type { SidebarSize } from './types';

/**
 * Every measurement a `size` changes, in one table.
 *
 * The collapsed width is NOT an independent number: it is the icon square plus
 * the panel's collapsed padding on both sides plus its two 1px borders, so the
 * square stays centred whatever the size. Spelling it out here (rather than
 * deriving it at render) keeps one place to read the rail's real width from —
 * a shell that reserves space for it needs the number, not the formula.
 */
export interface SidebarMetrics {
  /** The expanded panel's width. */
  expanded: number;
  /** The collapsed rail's width: `square + 2 × collapsedPaddingX + 2px border`. */
  collapsed: number;
  /** The panel's inset while expanded. */
  padding: number;
  /** The panel's horizontal inset while collapsed. */
  collapsedPaddingX: number;
  row: {
    /** The row's own inset — its height is this twice, plus the taller of icon and label. */
    padding: number;
    /** Between the glyph and the label. */
    gap: number;
    /** The glyph's box. */
    icon: number;
    /** The collapsed row: a square of exactly this side. */
    square: number;
    label: TypeScaleVariant;
  };
  /**
   * The tree section's rows (`SidebarTreeSection`, `SidebarFolder`): one step
   * denser than the main rows, so a tree reads as subordinate at every size.
   */
  tree: {
    /** A tree row's vertical inset. */
    padding: number;
    /** The glyph's box, and the disclosure lane's side. */
    icon: number;
    /** The section label and every row and folder label. */
    label: TypeScaleVariant;
    /** The trailing `meta` chip. */
    meta: TypeScaleVariant;
    /** The loading, error and empty lines. */
    status: TypeScaleVariant;
  };
}

const COLLAPSED_PADDING_X = 7;

function size(
  expanded: number,
  padding: number,
  icon: number,
  label: TypeScaleVariant,
  tree: SidebarMetrics['tree'],
): SidebarMetrics {
  const square = icon + padding * 2;
  return {
    expanded,
    collapsed: square + COLLAPSED_PADDING_X * 2 + 2,
    padding: 12,
    collapsedPaddingX: COLLAPSED_PADDING_X,
    row: { padding, gap: 8, icon, square, label },
    tree,
  };
}

/**
 * The three row sizes. `md` balances compact controls with readable labels — 260 expanded, 56 collapsed, a 40px square, a 22px glyph and a
 * `headline-medium` label.
 */
export const SIDEBAR_METRICS: Record<SidebarSize, SidebarMetrics> = {
  sm: size(232, 6, 18, 'body-2-medium', {
    padding: 4,
    icon: 16,
    label: 'body-2-medium',
    meta: 'caption-2-medium',
    status: 'body-2-regular',
  }),
  md: size(260, 9, 22, 'headline-medium', {
    padding: 5,
    icon: 20,
    label: 'body-medium',
    meta: 'caption-1-medium',
    status: 'body-regular',
  }),
  lg: size(300, 10, 24, 'title-3-medium', {
    padding: 6,
    icon: 22,
    label: 'headline-medium',
    meta: 'body-2-medium',
    status: 'headline-regular',
  }),
};

const SizeContext = createContext<SidebarSize | null>(null);

/** A `Sidebar` publishes its size so a row inside it does not take one. */
export const SidebarSizeProvider = SizeContext.Provider;

/** The enclosing sidebar's size, or the row's own when it names one. */
export function useSidebarMetrics(own?: SidebarSize): SidebarMetrics {
  const inherited = useContext(SizeContext);
  const { size } = useBloomAppearance({ size: own }, { size: 'md', tone: 'neutral' });
  return SIDEBAR_METRICS[own ?? inherited ?? (size === 'xs' ? 'sm' : size)];
}
