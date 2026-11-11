import type { ViewStyle } from 'react-native';
import { WEB_POSITION_STICKY } from '../styles/web-view-style';
import { breakpointPx } from './constants';
import type { AppShellPanelDefinition } from './panel-layout-types';

/**
 * The cells of a stack: its panels, one under another, in a flex column. Nothing here measures or
 * distributes. Each cell states how it takes part in the column (`flex-grow`, `flex-basis`, `min`
 * and `max`, or a CSS length), and the platform's flexbox (the browser, Yoga) divides the room,
 * as it does for the columns of a deck.
 */

/** The sizes in px a panel was dragged to, by panel id. */
export type StackHeights = Readonly<Record<string, number>>;

/** The share of the window's height a docked panel takes when it has no height of its own. */
export const DOCK_WINDOW_SHARE = 45;
const DOCK_MAX = '70dvh';

export interface StackCellsOptions {
  /** The shell's width: a panel that is `floating` below a breakpoint leaves the column under it. */
  shellWidth: number;
  /** The page scrolls as a document: there is no height to divide, so a `sticky` panel is docked. */
  document: boolean;
  /** The gap between the panels, px. */
  gap: number;
  /** The window's bottom margin a docked panel keeps, px. */
  bottomInset?: number;
  heights?: StackHeights;
}

export interface StackCells {
  /** The panels in the column: shown, and not floating. */
  shown: readonly AppShellPanelDefinition[];
  /** Panels that are floating at this width: out of the column, presented as a sheet. */
  floating: ReadonlySet<string>;
  /** Two panels or more are in the column. One alone is that panel, in the page's own flow. */
  split: boolean;
  /** Panels docked at the window's bottom edge (a page that scrolls as a document). */
  docked: ReadonlySet<string>;
  /** The flex of the cell of panel `id`. */
  style: (id: string) => ViewStyle;
  /**
   * The room the docked panels take, gap included, as a CSS length the stylesheet adds up (`0px`
   * while none is docked), or null when the column cannot dock. The frames above end over it.
   */
  dockRoom: string | null;
}

/** A docked panel's height: dragged, else declared, else a share of the window within its bounds. */
function dockedLength(panel: AppShellPanelDefinition, heights: StackHeights): string {
  const fixed = heights[panel.id] ?? panel.height;
  if (fixed !== undefined && Number.isFinite(fixed)) return `${fixed}px`;
  const max = panel.maxHeight !== undefined ? `${panel.maxHeight}px` : DOCK_MAX;
  return `clamp(${panel.minHeight ?? 0}px, ${DOCK_WINDOW_SHARE}dvh, ${max})`;
}

/**
 * A panel that is closed: in the column, with no room, so that opening it is a change of the same
 * element's size and a transition runs, instead of an element that appears.
 */
const COLLAPSED: ViewStyle = {
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 0,
  height: 0,
  minHeight: 0,
  opacity: 0,
  overflow: 'hidden',
};

const FILL: ViewStyle = { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, minWidth: 0 };

const fixedHeight = (panel: AppShellPanelDefinition, heights: StackHeights) => {
  const declared = heights[panel.id] ?? panel.height;
  return declared !== undefined && Number.isFinite(declared) && declared >= 0
    ? declared
    : undefined;
};

export function stackCells(
  members: readonly AppShellPanelDefinition[],
  { shellWidth, document, gap, bottomInset = 0, heights = {} }: StackCellsOptions,
): StackCells {
  const floating = new Set(
    members
      .filter((panel) => panel.floating && shellWidth < breakpointPx(panel.floating.below))
      .map((panel) => panel.id),
  );
  const shown = members.filter((panel) => panel.visible !== false && !floating.has(panel.id));
  const split = shown.length > 1;
  const docked = new Set(
    split && document ? shown.filter((panel) => panel.sticky).map((panel) => panel.id) : [],
  );
  const dockedPanels = shown.filter((panel) => docked.has(panel.id));
  // A column that can dock declares the room even while nothing is docked (`0px`), so that the
  // frames above follow the panel as it opens and closes.
  const dockRoom =
    document && members.some((panel) => panel.sticky)
      ? dockedPanels.length
        ? `calc(${dockedPanels.map((panel) => `${dockedLength(panel, heights)} + ${gap}px`).join(' + ')})`
        : '0px'
      : null;
  // A bounded column whose panels all have a height of their own still has to fill: the last flexes.
  const flexes = (panel: AppShellPanelDefinition) =>
    fixedHeight(panel, heights) === undefined ||
    (panel === shown[shown.length - 1] &&
      shown.every((p) => fixedHeight(p, heights) !== undefined));
  return {
    shown,
    floating,
    split,
    docked,
    dockRoom,
    style(id) {
      const panel = shown.find((candidate) => candidate.id === id);
      // A floating panel is out of the column, in a sheet; a closed one is in it, with no room.
      if (!panel) return floating.has(id) ? { display: 'none' } : COLLAPSED;
      // One panel alone is that panel: in a document it has the height of its content and the page
      // scrolls; in a bounded column it fills the column.
      if (!split) return document ? {} : FILL;
      if (docked.has(id))
        return {
          position: WEB_POSITION_STICKY,
          bottom: bottomInset,
          zIndex: 2,
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: 'auto',
          height: dockedLength(panel, heights) as ViewStyle['height'],
        };
      // In a document the panels that are not docked take their own height, and the page scrolls.
      if (document) return {};
      const bounds: ViewStyle = {
        minHeight: panel.minHeight ?? 0,
        ...(panel.maxHeight !== undefined ? { maxHeight: panel.maxHeight } : null),
        minWidth: 0,
      };
      if (flexes(panel)) {
        const span = panel.span !== undefined && panel.span > 0 ? panel.span : 1;
        return { ...bounds, flexGrow: span, flexShrink: 1, flexBasis: 0 };
      }
      // A definite size, with `flexBasis: auto`: Fabric keeps a basis that changed between commits
      // until it is cleared; a definite size is read again on every layout.
      return {
        ...bounds,
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        height: fixedHeight(panel, heights),
      };
    },
  };
}
