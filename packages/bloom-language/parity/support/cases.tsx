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
}

/** Bloom JSX that reads the theme as an app does (`useThemePaint()`), for a colour passed by hand. */
export function Themed({ children }: { children: (colors: ThemeColors) => ReactNode }): ReactNode {
  return children(useThemePaint());
}
