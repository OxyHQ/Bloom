import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { AccentFill, AccentTone } from '../theme/accent-colors';

/**
 * 24 / 24 / 28 / 32 / 40 tall. `xl` and `2xl` are the filter rungs: the scale
 * used to stop at 28, which is why five families drew their own pill. The table
 * is in `shared.ts`.
 */
export type ChipSize = 'small' | 'medium' | 'large' | 'xl' | '2xl';

/**
 * The three accent fills, plus `inverted`: a hairline pill on the page that
 * turns the page's own reading pair OVER when selected, rather than promoting
 * to the brand tone. `shared.ts` says why that is a different idea rather than
 * a fourth loudness.
 */
export type ChipVariant = AccentFill | 'inverted';

/**
 * Data hues: a category, a department, an objective — colours that carry
 * data rather than a status role.
 */
export type ChipHue = 'lime' | 'rose' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'neutral' | 'gray' | 'soft';

/**
 * What a pressable chip IS, which decides the state ARIA reads it by:
 * a toggle `button` (`aria-pressed`), a `radio` in a radiogroup
 * (`aria-checked`), or a `tab` in a tablist (`aria-selected`).
 */
export type ChipRole = 'button' | 'radio' | 'tab';

export interface ChipProps {
  /** Text content of the chip. */
  children?: React.ReactNode;
  /**
   * How loudly the chip is painted. `subtle` used to be spelled `soft` here and
   * `subtle` on `Badge` — one concept, two names, resolved by the shared
   * {@link AccentFill}.
   */
  variant?: ChipVariant;
  /** Semantic color. */
  color?: AccentTone;
  /**
   * Paints the chip in one of the data hues instead of `color` +
   * `variant` (both are ignored while it is set; `selected` still promotes the
   * chip to the brand tone). Pair it with a size for the right emphasis:
   * `bold` is `medium`, `subtle` is `large`, `caption` is `small`.
   */
  hue?: ChipHue;
  /**
   * The colour the chip sits on. A hue's dark fill is translucent,
   * so it is mixed over this. Defaults to the page background.
   */
  surface?: string;
  /** Size preset. */
  size?: ChipSize;
  /** Icon rendered before the label. */
  startIcon?: React.ReactNode;
  /** Icon or close button rendered after the label. */
  endIcon?: React.ReactNode;
  /** Called when the chip is pressed. Makes the chip interactive. */
  onPress?: () => void;
  /** Called when the close/end icon is pressed. */
  onClose?: () => void;
  /** Whether the chip is in a selected state. */
  selected?: boolean;
  /**
   * What a pressable chip is to assistive technology. Default `button`
   * (`aria-pressed`). Use `radio` inside a `radiogroup` and `tab` inside a
   * `tablist` — the state attribute follows the role, and a `radio` announcing
   * `aria-pressed` is invalid.
   */
  role?: ChipRole;
  /** Whether the chip is disabled. */
  disabled?: boolean;
  /**
   * Web only, for a roving-tabindex row: `-1` takes the chip out of the tab
   * order so the row is a single tab stop. Inert on native.
   */
  tabIndex?: number;
  /**
   * Web only: key handling for a roving-tabindex row (arrows move focus).
   * Inert on native.
   */
  onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export interface ChipRowProps {
  /** The pills. */
  children?: React.ReactNode;
  /** Between pills. Default 8. */
  gap?: number;
  /** Side padding inside the scroller, so the first and last pill clear the edge. */
  contentInset?: number;
  /**
   * The colour the web edge fades blend into — the surface behind the row.
   * Default the page background.
   */
  fadeColor?: string;
  /**
   * Room kept on every side for a pill's focus ring, taken back out again with
   * negative margins so the row still lines up with what is above it. Default 4.
   */
  ringInset?: number;
  /** What the row is: a `group` of toggles, a `radiogroup`, or a `tablist`. Default `group`. */
  role?: 'group' | 'radiogroup' | 'tablist';
  /** Names the row. Required for anything but a plain `group` of self-naming pills. */
  accessibilityLabel?: string;
  /** Marks the whole row disabled to assistive technology (web `aria-disabled`). */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
