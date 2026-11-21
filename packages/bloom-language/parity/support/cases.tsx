import type { ReactElement, ReactNode } from 'react';
import { useThemePaint, type ThemeColors } from '@oxy.so/bloom/theme';

export type Scheme = 'light' | 'dark';

/** One comparison: a language tree and what an app draws with Bloom today. */
export interface ParityCase {
  name: string;
  /** The language tree, as `toElement(node)`. */
  language: () => ReactElement;
  /** The Bloom element it stands for. */
  bloom: () => ReactElement;
  /**
   * Where the claim is that the case draws nothing (a closed overlay on the
   * web). Anywhere else an empty tree fails: two empty trees prove nothing.
   */
  drawsNothing?: readonly ('native' | 'web')[];
  /**
   * In Chrome, each side is drawn alone in a frame of the same size (a case
   * that pins to the document lands where its frame puts it, not where its
   * table cell sits).
   */
  isolated?: true;
}

/** Bloom JSX that reads the theme as an app does (`useThemePaint()`), for a colour passed by hand. */
export function Themed({ children }: { children: (colors: ThemeColors) => ReactNode }): ReactNode {
  return children(useThemePaint());
}
