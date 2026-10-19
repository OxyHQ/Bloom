/**
 * Text-range decorations (highlights and carets an application puts on a
 * block's text), laid into the runs a block's text is drawn with, and the
 * stretches to measure on an input. Pure, so it is tested without a renderer.
 */
import type { TextRangeDecoration } from './decorations';
import type { RunStyle, TextRun } from './text-runs';

/** What a block's text is drawn as: runs of text, and carets between them. */
export type DecoratedRun =
  | { kind: 'text'; text: string; style: RunStyle }
  | { kind: 'caret'; color: string; label?: string };

/** A decoration within a text of `length`: its stretch in order, its caret's offset. */
interface Placed {
  from: number;
  to: number;
  at: number;
  background?: string;
  caret?: { color: string; label?: string };
}

const clamp = (value: number, length: number) => Math.max(0, Math.min(length, Math.trunc(value)));

/** The decorations that can be placed in a text of `length`, clamped to it. */
function place(ranges: readonly TextRangeDecoration[], length: number): Placed[] {
  const placed: Placed[] = [];
  for (const range of ranges) {
    if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) continue;
    const start = clamp(range.start, length);
    const end = clamp(range.end, length);
    placed.push({
      from: Math.min(start, end),
      to: Math.max(start, end),
      at: end,
      ...(range.background !== undefined && { background: range.background }),
      ...(range.caret !== undefined && { caret: range.caret }),
    });
  }
  return placed;
}

/**
 * The runs with the decorations laid in: each run split where a highlight
 * starts or ends, the highlight's colour behind what it covers (the last
 * range given wins where two overlap, over the text's own highlight), and a
 * caret before the text at its offset — carets at one offset in the order
 * given, a caret past the end after the last run.
 */
export function decorateRuns(
  runs: readonly TextRun[],
  ranges: readonly TextRangeDecoration[] | undefined,
): DecoratedRun[] {
  const length = runs.reduce((sum, run) => sum + run.text.length, 0);
  const placed = place(ranges ?? [], length);
  const highlights = placed.filter((p) => p.background !== undefined && p.from < p.to);
  const carets = placed
    .map((p, order) => ({ ...p, order }))
    .filter((p) => p.caret !== undefined)
    .sort((a, b) => a.at - b.at || a.order - b.order);
  const cuts = new Set<number>();
  for (const h of highlights) {
    cuts.add(h.from);
    cuts.add(h.to);
  }
  for (const c of carets) cuts.add(c.at);

  const out: DecoratedRun[] = [];
  let next = 0;
  const caretsUpTo = (offset: number) => {
    while (next < carets.length && (carets[next]?.at ?? Infinity) <= offset) {
      const { caret } = carets[next] as Placed & { caret: { color: string; label?: string } };
      out.push({
        kind: 'caret',
        color: caret.color,
        ...(caret.label !== undefined && { label: caret.label }),
      });
      next += 1;
    }
  };

  let offset = 0;
  for (const run of runs) {
    const end = offset + run.text.length;
    const points = [offset, ...[...cuts].filter((cut) => cut > offset && cut < end), end].sort(
      (a, b) => a - b,
    );
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i] as number;
      const to = points[i + 1] as number;
      if (from === to) continue;
      caretsUpTo(from);
      let background: string | undefined;
      for (const h of highlights) if (h.from <= from && to <= h.to) background = h.background;
      out.push({
        kind: 'text',
        text: run.text.slice(from - offset, to - offset),
        style: background === undefined ? run.style : { ...run.style, backgroundColor: background },
      });
    }
    offset = end;
  }
  caretsUpTo(Infinity);
  return out;
}

/** A stretch of an input's text to measure, and what is drawn on it. */
export type RangeMark =
  | { kind: 'highlight'; start: number; end: number; color: string }
  | { kind: 'caret'; start: number; end: number; color: string; label?: string };

/**
 * What to draw over an input for the decorations: the highlights (a stretch
 * each), then the carets (an offset each) — so highlights are drawn under the
 * text and carets over it.
 */
export function rangeMarks(
  ranges: readonly TextRangeDecoration[] | undefined,
  length: number,
): RangeMark[] {
  const placed = place(ranges ?? [], length);
  const marks: RangeMark[] = [];
  for (const p of placed) {
    if (p.background !== undefined && p.from < p.to) {
      marks.push({ kind: 'highlight', start: p.from, end: p.to, color: p.background });
    }
  }
  for (const p of placed) {
    if (p.caret === undefined) continue;
    marks.push({
      kind: 'caret',
      start: p.at,
      end: p.at,
      color: p.caret.color,
      ...(p.caret.label !== undefined && { label: p.caret.label }),
    });
  }
  return marks;
}
