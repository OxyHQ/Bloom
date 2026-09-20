import type { StyleProp, ViewStyle } from 'react-native';

/** One heading of the document, as the app already has it. */
export interface OutlineHeading {
  /** Stable id. What `onSelect` hands back and what `activeId` names. */
  id: string;
  /** The heading as written. One line, truncated. */
  label: string;
  /**
   * Its rank, 1 for the top. Levels may SKIP — a document that goes 1, 3, 3 is
   * perfectly ordinary and the nesting is built from the order, not from the
   * arithmetic.
   */
  level: number;
}

/**
 * `full` is the side column of a wide screen: a title, the progress bar and the
 * whole tree. `compact` is what fits beside a phone's body text: no title,
 * touch-sized rows, and the deep levels dropped rather than squeezed.
 */
export type OutlineNavVariant = 'full' | 'compact';

/** The English words `OutlineNav` composes. */
export interface OutlineNavLabels {
  /** Names the navigation region AND the progress bar. Default `"On this page"`. */
  outline?: string;
  /** The progress bar's spoken reading, given the position and the total. Default ``(at, of) => `Heading ${at} of ${of}` ``. */
  progress?: (at: number, of: number) => string;
}

export interface OutlineNavProps {
  /** The headings, in document order. */
  headings: ReadonlyArray<OutlineHeading>;
  /** Which heading the reader is in. Marked `aria-current` and drawn with the rail. */
  activeId?: string;
  /**
   * Called when a heading is chosen. **The app does the jumping** — this
   * component has no idea where the body is, and a scroll it performed itself
   * would find the wrong scroller in a split view.
   */
  onSelect?: (heading: OutlineHeading) => void;
  /** Default `full`. */
  variant?: OutlineNavVariant;
  /**
   * How far through the document the reader is, 0 to 1. Omitted, it is derived
   * from `activeId`'s position — which is right for a jump list and wrong for a
   * continuous scroll, so a screen that measures scroll passes its own.
   */
  progress?: number;
  /** Hides the progress bar. Default `false`. */
  hideProgress?: boolean;
  /** The label above the list in `full`. Default the `outline` label. */
  title?: string;
  /**
   * The deepest level `compact` draws. Default `2` — the levels below it are
   * DROPPED rather than squeezed into an indent nobody can see on a phone.
   * Ignored by `full`, which draws everything.
   */
  compactMaxLevel?: number;
  /** Names the navigation region. Defaults to the `outline` label. */
  accessibilityLabel?: string;
  labels?: OutlineNavLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
