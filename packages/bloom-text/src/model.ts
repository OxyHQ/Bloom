/**
 * The platform-free half of the package: the segment model, the HTML wire
 * format and reconciliation. Safe to import on a server or in tests.
 */
export {
  applyMarks,
  applyPlainTextChange,
  applyTextEdit,
  coalesceSegments,
  diffText,
  marksEqual,
  marksOf,
  rangeHasMark,
  segmentsEqual,
  segmentsToPlainText,
  splitSegmentsAt,
} from './segments';
export { htmlToSegments, isSafeLink, segmentsToHtml } from './html';
export { mergeText } from './merge';
export { INPUT_MARKS, VALUE_ONLY_MARKS, reconcileInputValue } from './reconcile';
export { transformSelection } from './selection';
export type {
  ActiveMarks,
  MentionMark,
  RichTextChange,
  Segment,
  TextEdit,
  TextMarks,
  TextSelection,
  ToggleableMark,
} from './types';
