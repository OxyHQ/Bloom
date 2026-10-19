import type { TextRect, TextSelection } from './types';

/**
 * Native: `react-native-enriched-html` exposes no text layout — no caret
 * rectangle, no rectangles for a range — only the measurements of the view as
 * a whole. Where a character is drawn cannot be known, so nothing is measured.
 */
export function measureRanges(
  _wrapper: unknown,
  _expected: string,
  _ranges: readonly TextSelection[],
): TextRect[][] | null {
  return null;
}
