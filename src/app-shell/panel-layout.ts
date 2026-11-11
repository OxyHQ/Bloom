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

/**
 * A track as native flex lays it out: what `panelLayoutCss` writes for the web,
 * as Yoga's flex values along the group's axis. Room only selects semantic
 * capacity/floating states. Yoga divides the room continuously; React hears
 * only threshold changes (shell breakpoints and group minimum capacity), so
 * `shellWidth` and `room` may be quantized (`quantizeWidth`).
 */
export interface PanelFlexTrack {
  id: string;
  visible: boolean;
  /** Responsive presentation, independent of its open intent. */
  floating?: boolean;
  /** Along the group's axis. */
  grow: number;
  shrink: number;
  basis: number;
  /** The basis is the content's own size (a vertical document's natural height). */
  basisAuto?: boolean;
  min: number;
  /** `Infinity`: no maximum. */
  max: number;
  /** The leading gap before it (none for the first shown track). */
  gap: number;
}

/** The thresholds of the shell's width a layout's tracks are decided at. */
export function panelLayoutWidthThresholds(layout: AppShellPanelLayout): number[] {
  const thresholds = new Set<number>([0]);
  for (const panel of layout.panels) {
    if (panel.group)
      for (const threshold of panelLayoutWidthThresholds(panel.group)) thresholds.add(threshold);
    if (panel.hideBelow !== undefined) thresholds.add(breakpointPx(panel.hideBelow));
    if (panel.floating) thresholds.add(breakpointPx(panel.floating.below));
  }
  if (layout.collapseBelow !== undefined) thresholds.add(breakpointPx(layout.collapseBelow));
  if (typeof layout.axis === 'object')
    for (const name of Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[])
      if (layout.axis[name]) thresholds.add(BREAKPOINTS[name]);
  return [...thresholds].sort((a, b) => a - b);
}

/**
 * The room below which a split shows only its active track: every eligible
 * track's minimum and the gaps between them, along the axis.
 */
export function panelLayoutMinimum(
  layout: AppShellPanelLayout,
  shellWidth: number,
  gap: number,
): number {
  const axis = resolvePanelAxis(layout, shellWidth);
  const eligible = eligiblePanels(layout, shellWidth).map((panel) => panelForAxis(panel, axis));
  return (
    eligible.reduce((sum, panel) => sum + panelMinimum(panel), 0) +
    Math.max(0, eligible.length - 1) * gap
  );
}

/**
 * Each panel's declarative flex constraints and responsive eligibility.
 * The native engine distributes the actual room: a flexible split
 * track grows by its span from a zero basis; one with a width of its own keeps
 * it beside flexible ones and grows by its span when none is; a deck column
 * keeps its width and takes spare room only by an explicit span; a track shown
 * alone fills the group. `room` is the group's size along its axis.
 */
export function resolvePanelFlex(
  layout: AppShellPanelLayout,
  room: number,
  shellWidth: number,
  gap: number,
  dimensions: Readonly<Record<string, number>> = {},
): PanelFlexTrack[] {
  const axis = resolvePanelAxis(layout, shellWidth);
  const vertical = axis === 'vertical';
  const eligible = eligiblePanels(layout, shellWidth).map((panel) => panelForAxis(panel, axis));
  const natural =
    vertical && (layout.mode === 'flow' || (layout.flow === 'document' && layout.mode !== 'deck'));
  const deck = layout.mode === 'deck' || layout.mode === 'flow' || natural;
  const minimum =
    eligible.reduce((sum, panel) => sum + panelMinimum(panel), 0) +
    Math.max(0, eligible.length - 1) * gap;
  const compact =
    layout.mode !== 'deck' &&
    layout.mode !== 'flow' &&
    ((layout.collapseBelow !== undefined && shellWidth < breakpointPx(layout.collapseBelow)) ||
      (!natural && room < minimum));
  const active =
    eligible.find((panel) => panel.id === (layout.expandedPanel ?? layout.activePanel)) ??
    eligible[0];
  const forced = !!layout.expandedPanel || compact;
  const shown = forced ? eligible.filter((panel) => panel.id === active?.id) : eligible;
  const own = (panel: AppShellPanelDefinition) => dimensions[panel.id] ?? panel.width;
  const flexible = shown.some((panel) => own(panel) === undefined);
  return layout.panels.map((declared) => {
    const position = shown.findIndex((candidate) => candidate.id === declared.id);
    const floating = declared.floating
      ? {
          floating:
            shellWidth < breakpointPx(declared.floating.below) ||
            (!!declared.floating.whenConstrained && compact && declared.id !== active?.id),
        }
      : {};
    if (position < 0)
      return {
        id: declared.id,
        visible: false,
        ...floating,
        grow: 0,
        shrink: 1,
        basis: 0,
        min: 0,
        max: Number.POSITIVE_INFINITY,
        gap: 0,
      };
    const panel = shown[position]!;
    const dimension = own(panel);
    const span = positive(panel.span, 1);
    const leading = position > 0 ? gap : 0;
    if (forced || (!deck && shown.length === 1 && dimension === undefined))
      return {
        id: declared.id,
        visible: true,
        ...floating,
        grow: 1,
        shrink: 1,
        basis: 0,
        min: 0,
        max: Number.POSITIVE_INFINITY,
        gap: leading,
      };
    const basis =
      dimension !== undefined
        ? clampPanelWidth(panel, dimension)
        : deck && !natural
          ? clampPanelWidth(panel, DEFAULT_PANEL_WIDTH)
          : 0;
    const grow = natural
      ? 0
      : deck
        ? Math.max(0, panel.span ?? 0)
        : flexible && dimension !== undefined
          ? 0
          : span;
    return {
      id: declared.id,
      visible: true,
      ...floating,
      grow,
      shrink: deck ? 0 : 1,
      basis,
      ...(natural && dimension === undefined ? { basisAuto: true } : {}),
      // Min/max remain native flex constraints; no JS water-fill distribution.
      min: panelMinimum(panel),
      max: panelMaximum(panel),
      gap: leading,
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

/** A gesture may reduce an oversized pane, but cannot grow its excess back. */
export function panelContentResizeLimit(
  panel: AppShellPanelDefinition,
  currentSize: number,
  contentMaximum: number | undefined,
): AppShellPanelDefinition {
  if (contentMaximum === undefined || !Number.isFinite(contentMaximum) || contentMaximum < 0)
    return panel;
  return {
    ...panel,
    maxWidth: Math.min(
      panelMaximum(panel),
      Math.max(panelMinimum(panel), currentSize, contentMaximum),
    ),
  };
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
 * region growing or shrinking. Native Yoga allocates free space beyond each
 * minimum, so its gesture commit converts only that free portion to weights.
 * This conversion runs once per gesture; it does not distribute layout.
 */
export function splitPairSpans(
  first: AppShellPanelDefinition,
  second: AppShellPanelDefinition,
  firstSize: number,
  secondSize: number,
  minimumBasis = false,
): Record<string, number> {
  const total = positive(first.span, 1) + positive(second.span, 1);
  const firstFree = minimumBasis ? Math.max(0, firstSize - panelMinimum(first)) : firstSize;
  const secondFree = minimumBasis ? Math.max(0, secondSize - panelMinimum(second)) : secondSize;
  const pixels = firstFree + secondFree;
  if (!(pixels > 0) || !(total > 0)) return {};
  const share = Math.max(0, Math.min(1, firstFree / pixels));
  return {
    [first.id]: minimumBasis ? Math.max(Number.EPSILON, total * share) : total * share,
    [second.id]: minimumBasis ? Math.max(Number.EPSILON, total * (1 - share)) : total * (1 - share),
  };
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
  tracks: readonly Pick<PanelFlexTrack, 'visible' | 'floating'>[],
  vertical: boolean,
): (WindowChrome | null)[] {
  const shown = (index: number) => !!tracks[index]?.visible && !tracks[index]?.floating;
  const first = chrome ? tracks.findIndex((_, index) => shown(index)) : -1;
  return tracks.map((_, index) =>
    chrome == null || !shown(index)
      ? null
      : index === first
        ? chrome
        : vertical
          ? null
          : WINDOW_TOP_EDGE,
  );
}
