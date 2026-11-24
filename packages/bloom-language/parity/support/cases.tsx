import type { ReactElement, ReactNode } from 'react';
import { useTheme, useThemePaint, type ThemeColors } from '@oxy.so/bloom/theme';

/**
 * The theme mode a case is drawn in. `adaptive` is the platform's dynamic
 * palette on native (a mocked one: Bloom's `__mocks__/dynamic-palette.ts`) and
 * the system's on the web, where there is none.
 */
export type Scheme = 'light' | 'dark' | 'adaptive';

/** Every scheme a parity case is compared in. */
export const SCHEMES: readonly Scheme[] = ['light', 'dark', 'adaptive'];

/**
 * The setter of a binding a case holds still (the screen shows a value and
 * never changes it): the language's binding and Bloom's handler prop both
 * take it.
 */
export const hold = (): void => {};

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
  isolated?: boolean;
}

/** Bloom JSX that reads the theme as an app does (`useThemePaint()`), for a colour passed by hand. */
export function Themed({ children }: { children: (colors: ThemeColors) => ReactNode }): ReactNode {
  return children(useThemePaint());
}

/**
 * Bloom JSX that reads the theme's RGB colours as an app does for colour math
 * (`useTheme().colors`), for a list of colours passed by hand (a gradient).
 */
export function ThemedRgb({
  children,
}: {
  children: (colors: ThemeColors) => ReactNode;
}): ReactNode {
  return children(useTheme().colors);
}
