/**
 * Three-way merge of rich text: `mine` and `theirs` both changed `base`; the
 * result has both changes. It is what lets two people type in one block at
 * once without either losing their words, and lets undo take back one's own
 * typing without taking back someone else's.
 *
 * Text is compared in units — a code point with its marks, or a whole
 * mention (mentions are atomic: never split, never half-replaced). Each side's
 * change is the run between their common prefix and suffix with `base`; when
 * the two runs do not overlap both apply as they are, and when they do, what
 * `theirs` inserted is kept, what either deleted stays deleted, and what
 * `mine` inserted goes in beside it.
 */
import { coalesceSegments, marksEqual, marksOf } from './segments';
import type { Segment, TextMarks } from './model-types';

interface Unit {
  text: string;
  marks: TextMarks;
}

function unitsOf(segments: readonly Segment[]): Unit[] {
  const units: Unit[] = [];
  for (const segment of segments) {
    const marks = marksOf(segment);
    if (segment.mention) {
      if (segment.text) units.push({ text: segment.text, marks });
      continue;
    }
    for (const point of segment.text) units.push({ text: point, marks });
  }
  return units;
}

function segmentsOf(units: readonly Unit[]): Segment[] {
  return coalesceSegments(units.map((unit) => ({ ...unit.marks, text: unit.text })));
}

const same = (a: Unit, b: Unit) => a.text === b.text && marksEqual(a.marks, b.marks);

/** The units of `from` that `to` replaces: `[index, index + deleteCount)` → `insert`. */
interface Change {
  index: number;
  deleteCount: number;
  insert: Unit[];
}

function changeBetween(from: readonly Unit[], to: readonly Unit[]): Change | null {
  const max = Math.min(from.length, to.length);
  let prefix = 0;
  while (prefix < max && same(from[prefix] as Unit, to[prefix] as Unit)) prefix += 1;
  let suffix = 0;
  while (
    suffix < max - prefix &&
    same(from[from.length - 1 - suffix] as Unit, to[to.length - 1 - suffix] as Unit)
  ) {
    suffix += 1;
  }
  if (prefix === from.length && prefix === to.length) return null;
  return {
    index: prefix,
    deleteCount: from.length - prefix - suffix,
    insert: to.slice(prefix, to.length - suffix),
  };
}

export function mergeText(
  base: readonly Segment[],
  mine: readonly Segment[],
  theirs: readonly Segment[],
): Segment[] {
  const baseUnits = unitsOf(base);
  const result = unitsOf(theirs);
  const local = changeBetween(baseUnits, unitsOf(mine));
  if (!local) return segmentsOf(result);
  const remote = changeBetween(baseUnits, result);
  if (!remote) return segmentsOf(unitsOf(mine));

  const localEnd = local.index + local.deleteCount;
  const remoteEnd = remote.index + remote.deleteCount;
  /** Where `base`'s unit `at` (at or after the remote change) is in `theirs`. */
  const shifted = (at: number) => at - remote.deleteCount + remote.insert.length;

  if (localEnd <= remote.index) {
    // Wholly before (or inserting right where theirs begins): as it is.
    result.splice(local.index, local.deleteCount, ...local.insert);
  } else if (local.index >= remoteEnd) {
    result.splice(shifted(local.index), local.deleteCount, ...local.insert);
  } else {
    // Overlapping. What theirs inserted stays; delete what mine deleted that
    // theirs did not, right part first so the left positions hold.
    const afterTheirs = remote.index + remote.insert.length;
    if (localEnd > remoteEnd) result.splice(afterTheirs, shifted(localEnd) - afterTheirs);
    if (local.index < remote.index) {
      result.splice(local.index, remote.index - local.index, ...local.insert);
    } else {
      result.splice(afterTheirs, 0, ...local.insert);
    }
  }
  return segmentsOf(result);
}
