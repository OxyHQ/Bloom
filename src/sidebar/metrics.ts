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
}

const COLLAPSED_PADDING_X = 7;

function size(expanded: number, padding: number, icon: number, label: TypeScaleVariant): SidebarMetrics {
  const square = icon + padding * 2;
  return {
    expanded,
    collapsed: square + COLLAPSED_PADDING_X * 2 + 2,
    padding: 12,
    collapsedPaddingX: COLLAPSED_PADDING_X,
    row: { padding, gap: 8, icon, square, label },
  };
}

/**
 * The three row sizes. `md` is what this sidebar has always drawn, to the
 * pixel — 260 expanded, 52 collapsed, a 36px square, a 20px glyph and a
 * `body-medium` label.
 */
export const SIDEBAR_METRICS: Record<SidebarSize, SidebarMetrics> = {
  sm: size(232, 6, 18, 'body-2-medium'),
  md: size(260, 8, 20, 'body-medium'),
  lg: size(300, 10, 24, 'title-3-medium'),
  small: size(232, 6, 18, 'body-2-medium'),
  medium: size(260, 8, 20, 'body-medium'),
  large: size(300, 10, 24, 'title-3-medium'),
};

const SizeContext = createContext<SidebarSize | null>(null);

/** A `Sidebar` publishes its size so a row inside it does not take one. */
export const SidebarSizeProvider = SizeContext.Provider;

/** The enclosing sidebar's size, or the row's own when it names one. */
export function useSidebarMetrics(own?: SidebarSize): SidebarMetrics {
  const inherited = useContext(SizeContext);
  const canonical = own === 'small' ? 'sm' : own === 'medium' ? 'md' : own === 'large' ? 'lg' : own;
  const {size} = useBloomAppearance({size: canonical}, {size: 'md', tone: 'neutral'});
  return SIDEBAR_METRICS[own ?? inherited ?? (size === 'xs' ? 'sm' : size)];
}
