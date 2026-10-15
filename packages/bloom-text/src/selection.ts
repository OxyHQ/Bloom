import type { TextEdit, TextSelection } from './types';

function transformOffset(offset: number, edit: TextEdit): number {
  const end = edit.index + edit.deleteCount;
  if (offset <= edit.index) return offset;
  if (offset >= end) return offset + edit.insert.length - edit.deleteCount;
  // Inside the replaced span: land after what replaced it.
  return edit.index + edit.insert.length;
}

/**
 * Where a selection lands after an edit someone else made: text before the
 * edit keeps its offsets, text after shifts by the edit's length change.
 */
export function transformSelection(selection: TextSelection, edit: TextEdit): TextSelection {
  return {
    start: transformOffset(selection.start, edit),
    end: transformOffset(selection.end, edit),
  };
}
