import {
  WebSearch as BloomWebSearch,
  type WebSearchProps,
  type WebSearchStep,
} from '@oxy.so/bloom/web-search';

import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The web search: an agent's search trail and the sources it found. */
export type WebSearchKind = 'webSearch';

/** Bloom `WebSearch`'s reveal (its pace, or `revealed` from real events), words and handler. */
export type WebSearchOptions = Omit<WebSearchProps, 'steps' | 'style' | 'testID'>;

/** Bloom `WebSearch`. */
export type WebSearchView = ViewModifiers<WebSearchView>;

/** Bloom `WebSearch` of `steps`, in order (a source's `icon` is a React element: `toElement(view)`). */
export function WebSearch(
  steps: readonly WebSearchStep[],
  options: WebSearchOptions = {},
): WebSearchView {
  return new Node('webSearch', { steps, options }, []);
}

export const WEB_SEARCHES: Record<WebSearchKind, ControlRenderer> = {
  webSearch: product(BloomWebSearch),
};
