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

/**
 * A track as native flex lays it out: what `panelLayoutCss` writes for the web,
 * as Yoga's flex values along the group's axis. The room is never an input:
 * Yoga divides whatever room the group has in the same pass as a resize, so a
 * window resizing runs no JavaScript. Only the thresholds a width is compared
 * against decide anything here (the shell's breakpoints, the group's minimum),
 * so `shellWidth` and `room` may be quantized (`quantizeWidth`).
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
 * Flexible split tracks with minimums, as the CSS compositor divides room:
 * each takes `clamp(λ · span, min, max)` for the one `λ` that fills the room,
 * growing from a zero basis. Yoga instead starts a track at its minimum and
 * divides what is left (its flex basis is bounded by min and max), which would
 * draw `min + share`. So native gives Yoga the CSS answer piecewise: a track
 * held at its minimum is a fixed track of that size, and every other track
 * grows from zero with no minimum; which tracks are held changes only at
 * thresholds of the room (`flexibleRoomThresholds`), where React redraws.
 */
interface FlexibleTrack {
  id: string;
  span: number;
  min: number;
  max: number;
}

/** Below this a track's minimum and its share are the same size (px). */
const HELD_TOLERANCE = 1e-6;

/** What `λ` fills `available` (the water level), and the room each breakpoint needs. */
function waterLevel(tracks: readonly FlexibleTrack[], available: number): number {
  const filled = (level: number) =>
    tracks.reduce(
      (sum, track) => sum + Math.min(track.max, Math.max(track.min, level * track.span)),
      0,
    );
  const breakpoints = [
    0,
    ...tracks.flatMap((track) => [track.min / track.span, track.max / track.span]),
  ]
    .filter((level) => Number.isFinite(level))
    .sort((a, b) => a - b);
  // The highest level that fills no more than `available`: on a stretch where
  // every track is held (filling does not grow), the level is that stretch's
  // end, so a room exactly at a threshold holds no track that it fills.
  let low = 0;
  for (const level of breakpoints) {
    if (filled(level) > available) {
      const from = filled(low);
      return low + ((available - from) / (filled(level) - from)) * (level - low);
    }
    low = level;
  }
  const free = tracks.filter((track) => !Number.isFinite(track.max));
  const span = free.reduce((sum, track) => sum + track.span, 0);
  return span > 0 ? low + (available - filled(low)) / span : low;
}

/** The split's shown tracks and what of the room is theirs to divide, as `resolvePanelFlex` decides them. */
function splitShape(
  layout: AppShellPanelLayout,
  shellWidth: number,
  gap: number,
  dimensions: Readonly<Record<string, number>>,
) {
  const axis = resolvePanelAxis(layout, shellWidth);
  const eligible = eligiblePanels(layout, shellWidth).map((panel) => panelForAxis(panel, axis));
  const own = (panel: AppShellPanelDefinition) => dimensions[panel.id] ?? panel.width;
  const flexible: FlexibleTrack[] = eligible
    .filter((panel) => own(panel) === undefined)
    .map((panel) => ({
      id: panel.id,
      span: Math.max(Number.EPSILON, positive(panel.span, 1)),
      min: panelMinimum(panel),
      max: panelMaximum(panel),
    }));
  const fixed =
    eligible
      .filter((panel) => own(panel) !== undefined)
      .reduce((sum, panel) => sum + clampPanelWidth(panel, own(panel)!), 0) +
    Math.max(0, eligible.length - 1) * gap;
  return { flexible, fixed };
}

/**
 * The room at which a flexible track with a minimum stops being held at it
 * (`waterLevel` reaching `min / span`), for the group's size classes: between
 * two of these, which tracks are held does not change, and Yoga divides the
 * room alone.
 */
export function flexibleRoomThresholds(
  layout: AppShellPanelLayout,
  shellWidth: number,
  gap: number,
  dimensions: Readonly<Record<string, number>> = {},
): number[] {
  if (layout.mode === 'deck' || layout.expandedPanel) return [];
  const { flexible, fixed } = splitShape(layout, shellWidth, gap, dimensions);
  if (flexible.length < 2) return [];
  return flexible
    .filter((track) => track.min > 0)
    .map(
      (held) =>
        fixed +
        flexible.reduce(
          (sum, track) =>
            sum + Math.min(track.max, Math.max(track.min, (held.min / held.span) * track.span)),
          0,
        ),
    );
}

/**
 * Each panel's flex along the group's axis, decided as `resolvePanelTracks`
 * decides which tracks show (eligibility, collapse, the active one alone in too
 * little room) and sized as the CSS compositor sizes them: a flexible split
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
  const natural = vertical && layout.flow === 'document' && layout.mode !== 'deck';
  const deck = layout.mode === 'deck' || natural;
  const minimum =
    eligible.reduce((sum, panel) => sum + panelMinimum(panel), 0) +
    Math.max(0, eligible.length - 1) * gap;
  const compact =
    layout.mode !== 'deck' &&
    ((layout.collapseBelow !== undefined && shellWidth < breakpointPx(layout.collapseBelow)) ||
      (!natural && room < minimum));
  const active =
    eligible.find((panel) => panel.id === (layout.expandedPanel ?? layout.activePanel)) ??
    eligible[0];
  const forced = !!layout.expandedPanel || compact;
  const shown = forced ? eligible.filter((panel) => panel.id === active?.id) : eligible;
  const own = (panel: AppShellPanelDefinition) => dimensions[panel.id] ?? panel.width;
  const flexible = shown.some((panel) => own(panel) === undefined);
  // Two or more flexible split tracks: those the room holds at their minimum
  // (`waterLevel`, `flexibleRoomThresholds`).
  const held = new Set<string>();
  let regime = false;
  if (!forced && !deck) {
    const shape = splitShape(layout, shellWidth, gap, dimensions);
    if (shape.flexible.length > 1 && shape.flexible.some((track) => track.min > 0)) {
      regime = true;
      const level = waterLevel(shape.flexible, Math.max(0, room - shape.fixed));
      // A room exactly at a threshold (a size class's lower bound is one) is
      // past it: the track there no longer needs holding. Rounding must not
      // say otherwise.
      for (const track of shape.flexible)
        if (track.min > level * track.span + HELD_TOLERANCE) held.add(track.id);
    }
  }
  return layout.panels.map((declared) => {
    const position = shown.findIndex((candidate) => candidate.id === declared.id);
    const floating = declared.floating
      ? { floating: shellWidth < breakpointPx(declared.floating.below) }
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
    // Held at its minimum by the room: a fixed track of that size.
    if (held.has(panel.id))
      return {
        id: declared.id,
        visible: true,
        ...floating,
        grow: 0,
        shrink: 0,
        basis: panelMinimum(panel),
        min: panelMinimum(panel),
        max: panelMinimum(panel),
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
      // A flexible split track the room does not hold grows from zero with no
      // minimum for Yoga to start it at (the room keeps it above it).
      min: dimension === undefined && !deck && regime ? 0 : panelMinimum(panel),
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
        : vertical
          ? null
          : WINDOW_TOP_EDGE,
  );
}
