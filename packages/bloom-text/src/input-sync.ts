/**
 * Keeping a value and an uncontrolled native input in step.
 *
 * The input owns its content: it reports what it shows after every change
 * (its own, or a `setValue` it took), and takes new content only through
 * `setValue`, which it applies after whatever it was already doing. So a
 * report is always about the content the input had at that moment, which may
 * be older than the value: the person can type while a value pushed to the
 * input is on its way to it.
 *
 * - A report that shows a value pushed to it means the input took it; values
 *   pushed before it are behind the input too.
 * - Any other report is the person's edit of what the input showed. With
 *   nothing pushed and unshown, that is the value: the edit is taken as it is.
 *   With values on their way, the edit was made on content they replace when
 *   they land, so it is merged into the value (`mergeText`, three ways) and
 *   pushed again: the person's words are never lost to a change that crossed
 *   them.
 * - Until the input first shows a value it was given (on mount), its reports
 *   are its own loading states, not edits.
 *
 * Reports are compared on what the input can show: marks only the value
 * carries (`color`, `background`) never come back from it.
 */
import { mergeText } from './merge';
import { reconcileInputValue, VALUE_ONLY_MARKS } from './reconcile';
import { diffText, segmentsEqual, segmentsToPlainText } from './segments';
import { transformSelection } from './selection';
import type { RichTextChange, Segment, TextSelection } from './model-types';

/** The value as the input shows it: without the marks it cannot show. */
function asShown(segments: readonly Segment[]): Segment[] {
  return segments.map((segment) => {
    const shown = { ...segment };
    for (const key of VALUE_ONLY_MARKS) delete shown[key];
    return shown;
  });
}

/** Whether the input shows `a` and `b` the same. */
export function sameInInput(a: readonly Segment[], b: readonly Segment[]): boolean {
  return segmentsEqual(asShown(a), asShown(b));
}

/** What the input is told to do. */
export interface InputCommands {
  setValue: (value: Segment[]) => void;
  setSelection: (selection: TextSelection) => void;
}

export class InputSync {
  /** The value: last given, or last made from what the person typed. */
  private value: Segment[];
  /** What the input shows, as a value (with every mark); null until it first shows one. */
  private shown: Segment[] | null = null;
  /** Values pushed to the input that it has not shown yet, oldest first. */
  private readonly pending: Segment[][];
  private selection: TextSelection = { start: 0, end: 0 };

  /** `initial` is what the input was mounted with. */
  constructor(
    initial: Segment[],
    private readonly commands: InputCommands,
  ) {
    this.value = initial;
    this.pending = [initial];
  }

  /** Where the caret is: as the input last said, or as the app set it. */
  select(selection: TextSelection): void {
    this.selection = selection;
  }

  /**
   * A new value from outside (a collaborator, an undo). The input is given it
   * when it shows something else, with the caret where the same text still is.
   */
  update(next: Segment[]): void {
    if (segmentsEqual(next, this.value)) return;
    const before = this.value;
    this.value = next;
    if (sameInInput(next, before)) return;
    this.push(next, diffText(segmentsToPlainText(before), segmentsToPlainText(next)));
  }

  /**
   * The input reported what it shows. Returns the change to the value the
   * person made, or null when the report was not an edit.
   */
  report(reported: readonly Segment[]): RichTextChange | null {
    const taken = this.pending.findIndex((value) => sameInInput(value, reported));
    if (taken >= 0) {
      // The input took a value pushed to it, and every one pushed before.
      this.shown = this.pending[taken] as Segment[];
      this.pending.splice(0, taken + 1);
      return null;
    }
    // Before the input showed what it was mounted with: its own loading state.
    if (!this.shown) return null;

    const typed = reconcileInputValue(this.shown, reported).segments;
    const base = this.shown;
    this.shown = typed;
    if (this.pending.length === 0) {
      if (segmentsEqual(typed, this.value)) return null;
      return this.take(typed);
    }
    // Typed on content that values on their way to the input replace: the
    // edit goes into the value, and the input is given the result.
    const merged = mergeText(base, typed, this.value);
    const change = segmentsEqual(merged, this.value) ? null : this.take(merged);
    this.push(merged, diffText(segmentsToPlainText(typed), segmentsToPlainText(merged)));
    return change;
  }

  private take(next: Segment[]): RichTextChange {
    const edit = diffText(segmentsToPlainText(this.value), segmentsToPlainText(next));
    this.value = next;
    return { segments: next, text: segmentsToPlainText(next), edit };
  }

  private push(next: Segment[], edit: ReturnType<typeof diffText>): void {
    this.pending.push(next);
    this.commands.setValue(next);
    if (edit) this.selection = transformSelection(this.selection, edit);
    this.commands.setSelection(this.selection);
  }
}
