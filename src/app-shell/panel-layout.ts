import type { WindowChrome } from '../window/context';
import { breakpointPx } from './constants';
import { BREAKPOINTS } from '../styles/breakpoints';
import type { AppShellPanelDefinition, AppShellPanelLayout, PanelAxis } from './panel-layout-types';

export function resolvePanelAxis(layout: AppShellPanelLayout, width: number): PanelAxis {
  const axis = layout.axis;
  if (typeof axis === 'string') return axis;
  let result = axis?.base ?? 'horizontal';
  for (const key of Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[])
    if (width >= BREAKPOINTS[key] && axis?.[key]) result = axis[key]!;
  return result;
}
export function panelForAxis(
  panel: AppShellPanelDefinition,
  axis: PanelAxis,
): AppShellPanelDefinition {
  return axis === 'horizontal'
    ? panel
    : { ...panel, width: panel.height, minWidth: panel.minHeight, maxWidth: panel.maxHeight };
}
export const DEFAULT_PANEL_WIDTH = 360;
const positive = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback;
export const panelMinimum = (panel: AppShellPanelDefinition) => positive(panel.minWidth, 0);
export const panelMaximum = (panel: AppShellPanelDefinition) =>
  Math.max(panelMinimum(panel), positive(panel.maxWidth, Infinity));
export const clampPanelWidth = (panel: AppShellPanelDefinition, width: number) =>
  Math.max(panelMinimum(panel), Math.min(panelMaximum(panel), width));

export function eligiblePanels(layout: AppShellPanelLayout, shellWidth: number) {
  const ids = new Set<string>();
  for (const panel of layout.panels) {
    if (!panel.id || ids.has(panel.id))
      throw new Error('AppShell panel ids must be nonempty and unique.');
    ids.add(panel.id);
  }
  return layout.panels.filter(
    (panel) =>
      panel.visible !== false &&
      (!panel.floating || shellWidth >= breakpointPx(panel.floating.below)) &&
      (panel.hideBelow === undefined || shellWidth >= breakpointPx(panel.hideBelow)),
  );
}

/** Preferred envelope uses base tracks, never temporary expansion or resize. */
export function panelEnvelope(layout: AppShellPanelLayout, shellWidth: number, gap: number) {
  const panels = eligiblePanels(layout, shellWidth);
  if (resolvePanelAxis(layout, shellWidth) === 'vertical')
    return Math.max(
      0,
      ...panels.map((panel) => clampPanelWidth(panel, positive(panel.width, DEFAULT_PANEL_WIDTH))),
    );
  return (
    panels.reduce(
      (sum, panel) => sum + clampPanelWidth(panel, positive(panel.width, DEFAULT_PANEL_WIDTH)),
      0,
    ) +
    Math.max(0, panels.length - 1) * gap
  );
}

export interface ResolvedPanelTrack {
  id: string;
  width: number;
  visible: boolean;
  gap: number;
  /** Responsive presentation, independent of its open intent. */
  floating?: boolean;
}
export function resolvePanelTracks(
  layout: AppShellPanelLayout,
  available: number,
  shellWidth: number,
  gap: number,
  widths: Readonly<Record<string, number>> = {},
): ResolvedPanelTrack[] {
  const axis = resolvePanelAxis(layout, shellWidth);
  const eligible = eligiblePanels(layout, shellWidth).map((panel) => panelForAxis(panel, axis));
  const natural = axis === 'vertical' && layout.flow === 'document' && layout.mode !== 'deck';
  const deck = layout.mode === 'deck' || natural;
  const minimum =
    eligible.reduce((sum, panel) => sum + panelMinimum(panel), 0) +
    Math.max(0, eligible.length - 1) * gap;
  const compact =
    layout.mode !== 'deck' &&
    ((layout.collapseBelow !== undefined && shellWidth < breakpointPx(layout.collapseBelow)) ||
      (!natural && available < minimum));
  const active =
    eligible.find((panel) => panel.id === (layout.expandedPanel ?? layout.activePanel)) ??
    eligible[0];
  const shown =
    layout.expandedPanel || compact
      ? eligible.filter((panel) => panel.id === active?.id)
      : eligible;
  const room = Math.max(0, available - Math.max(0, shown.length - 1) * gap);
  // A flexible split track grows from a zero basis, as the CSS compositor's
  // `flex: <span> 1 0px` does: its share is proportional to its span, and only
  // a min/max boundary freezes it. Starting it at its minimum gave native a
  // `min + share` split that the browser never drew.
  const fromZero = (panel: AppShellPanelDefinition) =>
    !deck &&
    !natural &&
    widths[panel.id] === undefined &&
    panel.width === undefined &&
    shown.length > 1 &&
    !layout.expandedPanel;
  const sizes = shown.map((panel) =>
    fromZero(panel)
      ? 0
      : clampPanelWidth(
          panel,
          positive(
            widths[panel.id],
            positive(panel.width, deck && !natural ? DEFAULT_PANEL_WIDTH : panelMinimum(panel)),
          ),
        ),
  );
  if ((!deck || layout.expandedPanel) && shown.length === 1) sizes[0] = available;
  else if (!deck || (!natural && shown.some((panel) => (panel.span ?? 0) > 0))) {
    // Water-fill available room, freezing tracks at their min/max boundaries.
    for (let pass = 0; pass <= shown.length; pass++) {
      const delta = room - sizes.reduce((sum, value) => sum + value, 0);
      if (Math.abs(delta) < 0.01) break;
      // Deck columns may opt into spare room, but never shrink to fit:
      // overflow remains owned by the compositor's horizontal viewport.
      if (deck && delta < 0) break;
      let candidates = shown
        .map((panel, index) => ({ panel, index }))
        .filter(({ panel }) => !deck || (panel.span ?? 0) > 0)
        .filter(({ panel, index }) =>
          delta > 0 ? sizes[index]! < panelMaximum(panel) : sizes[index]! > panelMinimum(panel),
        );
      if (delta > 0 && !deck) {
        const flexible = candidates.filter(
          ({ panel }) => panel.width === undefined && widths[panel.id] === undefined,
        );
        if (flexible.length) candidates = flexible;
      }
      const weight = candidates.reduce(
        (sum, { panel }) => sum + Math.max(Number.EPSILON, positive(panel.span, 1)),
        0,
      );
      if (!weight) break;
      candidates.forEach(({ panel, index }) => {
        sizes[index] = clampPanelWidth(
          panel,
          sizes[index]! + (delta * Math.max(Number.EPSILON, positive(panel.span, 1))) / weight,
        );
      });
    }
  }
  shown.forEach((panel, index) => {
    if (sizes[index]! < panelMinimum(panel)) sizes[index] = panelMinimum(panel);
  });
  return layout.panels.map((panel) => {
    const index = shown.findIndex((candidate) => candidate.id === panel.id);
    return {
      id: panel.id,
      width: index < 0 ? 0 : sizes[index]!,
      visible: index >= 0,
      gap: index > 0 ? gap : 0,
      ...(panel.floating ? { floating: shellWidth < breakpointPx(panel.floating.below) } : {}),
    };
  });
}

/** Split resizing transfers width to the adjacent track, respecting BOTH limits. */
export function resizePanelPair(
  first: AppShellPanelDefinition,
  second: AppShellPanelDefinition,
  firstWidth: number,
  secondWidth: number,
  requested: number,
) {
  const total = firstWidth + secondWidth;
  const minimum = Math.max(panelMinimum(first), total - panelMaximum(second));
  const maximum = Math.min(panelMaximum(first), total - panelMinimum(second));
  const width = Math.max(minimum, Math.min(maximum, requested));
  return { [first.id]: width, [second.id]: total - width };
}

/** Committed weights override descriptor spans, in the resolver and the CSS compiler alike. */
export function applyPanelSpans(
  layout: AppShellPanelLayout,
  spans: Readonly<Record<string, number>> | undefined,
): AppShellPanelLayout {
  if (!spans) return layout;
  let changed = false;
  const panels = layout.panels.map((panel) => {
    const span = spans[panel.id];
    if (span === undefined || !Number.isFinite(span) || span <= 0 || span === panel.span)
      return panel;
    changed = true;
    return { ...panel, span };
  });
  return changed ? { ...layout, panels } : layout;
}

/** A split track with no width of its own: it takes a share of the room by its span. */
export function isFlexiblePanel(
  panel: AppShellPanelDefinition,
  vertical: boolean,
  dimensions: Readonly<Record<string, number>>,
) {
  return (
    dimensions[panel.id] === undefined && (vertical ? panel.height : panel.width) === undefined
  );
}

/**
 * The weights that draw a resized pair of flexible tracks at the sizes it
 * settled on. The pair keeps its combined span, so every other track keeps its
 * share; the split is the settled pixel ratio, so the proportion survives the
 * region growing or shrinking.
 */
export function splitPairSpans(
  first: AppShellPanelDefinition,
  second: AppShellPanelDefinition,
  firstSize: number,
  secondSize: number,
): Record<string, number> {
  const total = positive(first.span, 1) + positive(second.span, 1);
  const pixels = firstSize + secondSize;
  if (!(pixels > 0) || !(total > 0)) return {};
  const share = Math.max(0, Math.min(1, firstSize / pixels));
  return { [first.id]: total * share, [second.id]: total * (1 - share) };
}

/** A panel along the window's top edge, away from the controls: its header moves the window. */
export const WINDOW_TOP_EDGE: WindowChrome = { leading: 0 };

/**
 * The window's chrome for each panel (`window/context`): the first shown panel
 * is at the window's corner and keeps the controls' room; side by side, every
 * other shown panel is along the window's top edge too. Stacked, only the top
 * one is. A floating panel is a dialog, away from both.
 */
export function panelWindowChrome(
  chrome: WindowChrome | null,
  tracks: readonly Pick<ResolvedPanelTrack, 'visible' | 'floating'>[],
  vertical: boolean,
): (WindowChrome | null)[] {
  const shown = (index: number) => !!tracks[index]?.visible && !tracks[index]?.floating;
  const first = chrome ? tracks.findIndex((_, index) => shown(index)) : -1;
  return tracks.map((_, index) =>
    chrome == null || !shown(index)
      ? null
      : index === first
        ? chrome
        : chrome.topEdge === false
          ? null
          : vertical
            ? null
            : WINDOW_TOP_EDGE,
  );
}
