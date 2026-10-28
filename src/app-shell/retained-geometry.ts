/**
 * Geometry of a retained panel layout (`panelLayout.retain`): slots along the
 * layout's axis, each one panel or a `stack` of panels along the other axis,
 * divided by their spans with a fixed gap between neighbours.
 *
 * Every edge is written as a fraction of the region plus a fixed offset
 * (`calc(f * 100% + px)` spelled as a percentage inset and a margin), so the
 * same numbers lay the panels out on the web and on native, at any region
 * size, without measuring the region or the panels: a region that resizes
 * (a window, a navigation sliding away) moves them with no JavaScript.
 */

/** One edge: `fraction` of the region's extent, then `offset` points. */
export interface RetainedEdge {
  fraction: number;
  offset: number;
}

/** A panel's box as distances from the region's four edges (logical start/end). */
export interface RetainedBox {
  start: RetainedEdge;
  end: RetainedEdge;
  top: RetainedEdge;
  bottom: RetainedEdge;
}

export interface RetainedSlot {
  /** The stack's id for a stacked slot, else its one panel's id. */
  key: string;
  ids: readonly string[];
}

export interface RetainedPanelInput {
  id: string;
  stack?: string;
  span?: number;
  minWidth?: number;
  minHeight?: number;
}

/** A boundary between two neighbours, where a resize handle sits. */
export interface RetainedBoundary {
  /** `main` between slots, `cross` between the panels of a stack. */
  level: 'main' | 'cross';
  /** The slot holding a cross boundary. */
  slot?: string;
  /** The span keys on either side. */
  before: string;
  after: string;
  /** Where the gap's centre sits: along the boundary's axis, and the span it covers across. */
  at: RetainedEdge;
  across: { from: RetainedEdge; to: RetainedEdge };
}

/** Visible panels grouped into slots in their array order; a stack takes the place of its first panel. */
export function retainedSlots(panels: readonly RetainedPanelInput[]): RetainedSlot[] {
  const slots: { key: string; ids: string[] }[] = [];
  const stacks = new Map<string, { key: string; ids: string[] }>();
  for (const panel of panels) {
    if (panel.stack) {
      const existing = stacks.get(panel.stack);
      if (existing) {
        existing.ids.push(panel.id);
        continue;
      }
      const slot = { key: panel.stack, ids: [panel.id] };
      stacks.set(panel.stack, slot);
      slots.push(slot);
    } else slots.push({ key: panel.id, ids: [panel.id] });
  }
  return slots;
}

const weight = (spans: Readonly<Record<string, number>> | undefined, key: string, fallback = 1) => {
  const value = spans?.[key];
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
};

/** Fractions of the free room (the extent less the gaps) that each of `keys` takes. */
export function retainedFractions(
  keys: readonly string[],
  spans: Readonly<Record<string, number>> | undefined,
  fallback: (key: string) => number = () => 1,
): number[] {
  const weights = keys.map((key) => weight(spans, key, fallback(key)));
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  return weights.map((w) => w / total);
}

/**
 * Item `index` of a line divided by `fractions` with `gap` between items: its
 * leading edge from the line's start, and its trailing edge from the line's end.
 */
export function retainedLine(fractions: readonly number[], index: number, gap: number) {
  const gaps = gap * (fractions.length - 1);
  let before = 0;
  for (let i = 0; i < index; i++) before += fractions[i]!;
  const through = before + fractions[index]!;
  return {
    lead: { fraction: before, offset: index * gap - before * gaps },
    trail: { fraction: 1 - through, offset: through * gaps - index * gap },
  };
}

export interface RetainedGeometry {
  slots: RetainedSlot[];
  boxes: Record<string, RetainedBox>;
  boundaries: RetainedBoundary[];
}

const WHOLE: RetainedEdge = { fraction: 0, offset: 0 };

export function retainedGeometry(
  panels: readonly RetainedPanelInput[],
  options: {
    axis: 'horizontal' | 'vertical';
    gap: number;
    spans?: Readonly<Record<string, number>>;
  },
): RetainedGeometry {
  const { axis, gap, spans } = options;
  const byId = new Map(panels.map((panel) => [panel.id, panel]));
  const slots = retainedSlots(panels);
  const main = retainedFractions(
    slots.map((slot) => slot.key),
    spans,
    (key) => byId.get(key)?.span ?? 1,
  );
  const boxes: Record<string, RetainedBox> = {};
  const boundaries: RetainedBoundary[] = [];
  slots.forEach((slot, i) => {
    const { lead, trail } = retainedLine(main, i, gap);
    const cross = retainedFractions(slot.ids, spans, (id) => byId.get(id)?.span ?? 1);
    slot.ids.forEach((id, j) => {
      const inner = retainedLine(cross, j, gap);
      boxes[id] =
        axis === 'horizontal'
          ? { start: lead, end: trail, top: inner.lead, bottom: inner.trail }
          : { start: inner.lead, end: inner.trail, top: lead, bottom: trail };
      if (j < slot.ids.length - 1)
        boundaries.push({
          level: 'cross',
          slot: slot.key,
          before: id,
          after: slot.ids[j + 1]!,
          at: { fraction: 1 - inner.trail.fraction, offset: -inner.trail.offset + gap / 2 },
          across: { from: lead, to: trail },
        });
    });
    if (i < slots.length - 1)
      boundaries.push({
        level: 'main',
        before: slot.key,
        after: slots[i + 1]!.key,
        at: { fraction: 1 - trail.fraction, offset: -trail.offset + gap / 2 },
        across: { from: WHOLE, to: WHOLE },
      });
  });
  return { slots, boxes, boundaries };
}

/**
 * The spans after dragging the boundary between `before` and `after` by
 * `delta` points of a line whose free room (extent less gaps) is `free`: the
 * pair keeps its combined weight and divides it by where the drag settled,
 * neither side going under its minimum.
 */
export function resizeRetainedSpans(
  spans: Readonly<Record<string, number>>,
  keys: readonly string[],
  before: string,
  after: string,
  delta: number,
  free: number,
  minimum: { before: number; after: number },
): Record<string, number> {
  const fractions = retainedFractions(keys, spans);
  const a = fractions[keys.indexOf(before)] ?? 0;
  const b = fractions[keys.indexOf(after)] ?? 0;
  const room = Math.max(1, free);
  const pair = (a + b) * room;
  const floorA = Math.min(minimum.before, pair / 2);
  const floorB = Math.min(minimum.after, pair / 2);
  const settled = Math.min(Math.max(a * room + delta, floorA), pair - floorB);
  const combined = weight(spans, before) + weight(spans, after);
  const share = pair > 0 ? settled / pair : 0.5;
  return { ...spans, [before]: combined * share, [after]: combined * (1 - share) };
}

/** Keys in the order they were first seen: a key that leaves and returns goes to the end. */
export function retainedOrder(previous: readonly string[], ids: readonly string[]): string[] {
  const present = new Set(ids);
  const kept = previous.filter((id) => present.has(id));
  const known = new Set(kept);
  for (const id of ids) if (!known.has(id)) kept.push(id);
  return kept.length === previous.length && kept.every((id, i) => id === previous[i])
    ? (previous as string[])
    : kept;
}
