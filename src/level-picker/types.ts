import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface LevelPickerProps {
  /**
   * The levels, in order, low to high. Its LENGTH is the number of stops and
   * each entry is that stop's own name — read out as the slider's value
   * (`aria-valuetext`), so it is what a screen reader says instead of an index.
   *
   * Two levels is the floor at which the control means anything; one renders a
   * rail with a single stop and no travel.
   */
  levels: readonly string[];
  /** The selected level, as an index into {@link levels}. Controlled. */
  value: number;
  /** Fired with the new index as the user drags, clicks or steps the rail. */
  onValueChange: (value: number) => void;
  /**
   * The slider's accessible NAME — WHAT the level applies to.
   *
   * Required, not optional. A rail with a knob renders no text of its own, so
   * ARIA can compute no name from its contents and there is nothing for the
   * value to be announced against: without this the control says "slider, High"
   * and never what is High. The end captions and the summary row beside it are
   * SIBLINGS, not labels.
   */
  accessibilityLabel: string;
  /**
   * Captions for the two ends of the rail, shown while the slider is active
   * (hovered, focused or being dragged) and faded out otherwise, in the place
   * the summary row occupies.
   *
   * Both are optional and independent of {@link levels}: they name the
   * DIRECTION of the scale ("Cheaper"/"Sharper"), which is a different claim
   * from what any one stop is called, and a picker whose levels speak for
   * themselves can leave them off entirely.
   */
  minLabel?: string;
  maxLabel?: string;
  /**
   * The summary row's label — the disclosure that reveals {@link children}.
   * Defaults to `Details`, matching the `<details>`/`<summary>` vocabulary this
   * is the same shape as.
   */
  detailsLabel?: string;
  /** Whether the details region is showing. Controlled. */
  expanded?: boolean;
  /** Its initial state when uncontrolled. Defaults to `false`. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * The details region's contents — the rows the summary row reveals.
   *
   * Ordinary menu rows: `DropdownMenuSub` triggers, `DropdownMenuItem`s,
   * anything the surrounding surface publishes. The picker owns the reveal, the
   * spacing and the hairline above them, and nothing about what they are.
   */
  children?: ReactNode;
  /** Appended to the root's own classes, never substituted for them. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
