import { useRef } from 'react';

import { parseMarkdown } from './parse-blocks';
import type { MarkdownSegment } from './types';

/**
 * The document's top-level blocks. Each render hands the previous result back to
 * `parseMarkdown`, so a block whose text did not change keeps its identity and
 * the memoized view above it skips rendering.
 */
export function useMarkdownBlocks(text: string): MarkdownSegment[] {
  const previous = useRef<MarkdownSegment[]>([]);
  const segments = parseMarkdown(text, previous.current);
  previous.current = segments;
  return segments;
}
