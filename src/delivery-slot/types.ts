import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * How fast, as a PRICED class of service — not as a loudness.
 *
 * `standard` is what the day's windows are unless the seller says otherwise;
 * `express` is the window that costs more to get sooner and says so. The pair
 * is closed because a third rung ("same day", "priority") is the same two
 * facts — a name and a surcharge — which a window already carries in `label`
 * and `price`.
 */
export type DeliveryTier = 'standard' | 'express';

/** One day across the top of the picker. */
export interface DeliveryDay {
  /** Identifies the day to `onDayChange` and `day`. */
  id: string;
  /** The short weekday — "Fri". PRE-FORMATTED; nothing here reads a clock. */
  weekday: string;
  /** The date in the month — "24". Drawn in tabular figures. */
  day: string;
  /** Nothing left on this day: struck through, dimmed, not pressable. */
  disabled?: boolean;
  /**
   * The spoken form. Default `"<weekday> <day>"` — pass the long one
   * ("Friday 24 October") where the abbreviation would be read as a word.
   */
  accessibilityLabel?: string;
  testID?: string;
}

/** One window of the chosen day. */
export interface DeliveryWindow {
  /** Identifies the window to `onValueChange` and `value`. */
  id: string;
  /** The window itself — "17:00 – 19:00". PRE-FORMATTED. */
  label: string;
  /** Default `standard`. */
  tier?: DeliveryTier;
  /**
   * What it costs ON TOP of the order, PRE-FORMATTED and sign included:
   * `"Free"`, `"+€2.50"`. Nothing here adds, converts or formats a number.
   */
  price?: string;
  /**
   * How much of the window is left — `"2 left"`, `"Almost full"`. It is a
   * string because "2 left" and "last slot" are the same fact said two ways,
   * and only the app knows which one its couriers mean.
   */
  capacity?: string;
  /** Taken: drawn at the disabled opacity, announced as unavailable, not pressable. */
  soldOut?: boolean;
  /** Unavailable for a reason that is not "full" — outside a promo, too late to change. */
  disabled?: boolean;
  /** One more quiet line — "Leaves the depot at 16:00". */
  note?: string;
  /** Default: the window, its tier, its price and whatever is left, as one utterance. */
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * The option that is not a window: as soon as someone can take it.
 *
 * It belongs to no day, so it sits at the HEAD of the options and stays there
 * while the days change — and it is in the same radio group as the windows,
 * because it is the same choice. It is not a second control beside them: a
 * button labelled "ASAP" next to a group of windows is how a reader ends up
 * with both chosen, or neither.
 */
export interface DeliveryAsapOption {
  /** Identifies it to `onValueChange` and `value`. */
  id: string;
  /** Default `"As soon as possible"`. */
  label?: string;
  /** The reading that replaces a window — "25 – 35 min". PRE-FORMATTED. */
  eta?: string;
  /** Its surcharge, PRE-FORMATTED. */
  price?: string;
  /** Default a lightning glyph. */
  icon?: BloomIconComponent;
  soldOut?: boolean;
  disabled?: boolean;
  /** One more quiet line — "Handed to the next free courier". */
  note?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export interface DeliverySlotDaysProps {
  days: readonly DeliveryDay[];
  /** The chosen day's `id`. */
  value?: string;
  onChange?: (id: string) => void;
  /** Names the strip. Default `"Day"`. */
  accessibilityLabel?: string;
  /** Disables every day. A day may also disable itself. */
  disabled?: boolean;
  /**
   * The colour the strip's scroll fade blends into — the surface behind it.
   * Defaults to the page background, which is wrong on a card, so say so.
   */
  fadeColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface DeliverySlotOptionProps {
  /** The line a reader chooses by — "17:00 – 19:00", "As soon as possible". */
  label: string;
  /** Under it — "Standard · 2 left", "Sold out". */
  detail?: string;
  /** At the end of the row, PRE-FORMATTED — "Free", "+€2.50". */
  price?: string;
  /** A node after the label — a `Badge` ("Express"). */
  badge?: ReactNode;
  /**
   * A glyph BEFORE the label — the lightning the ASAP row carries. It does not
   * replace the radio dot: the dot is what says "one of these", and a row that
   * dropped it would look like a different control inside the same group.
   */
  icon?: BloomIconComponent;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Default: the label, the detail and the price, as one utterance. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface DeliverySlotPickerProps {
  /**
   * The name of the choice, which is also the radio group's accessible name.
   *
   * Deliberately UNDEFAULTED: dropped inside somebody's `Field`, the picker
   * renders no second field and the enclosing field's label is what names the
   * group — a default here would outrank the one string the user can read.
   * Standalone, the picker supplies its own field and labels it
   * `"Delivery time"`.
   */
  label?: string;
  /** Under the group — "Windows fill up; yours is held for 10 minutes." Ignored inside another `Field`. */
  description?: string;
  /** A non-empty string puts the field in its invalid state. Ignored inside another `Field`. */
  error?: string | null;
  /** Ignored inside another `Field`. */
  required?: boolean;
  /** Disables the strip and every option. An option may also disable itself. */
  disabled?: boolean;

  days: readonly DeliveryDay[];
  /** The chosen day's `id`. */
  day?: string;
  onDayChange?: (id: string) => void;
  /** Names the day strip. Default `"Day"`. */
  dayLabel?: string;

  /** The windows OF THE CHOSEN DAY. The app reloads them when the day changes. */
  windows: readonly DeliveryWindow[];
  /** The chosen window's — or the ASAP option's — `id`. */
  value?: string;
  onValueChange?: (id: string) => void;

  /** The option that is not a window. */
  asap?: DeliveryAsapOption;

  /** Draws placeholder rows instead of the windows, announced as busy. */
  loading?: boolean;
  /** How many placeholder rows. Default 3. */
  loadingRows?: number;
  /** Replaces the whole empty block. */
  empty?: ReactNode;
  /** Default `"No windows left"`. */
  emptyTitle?: string;
  /** Default `"Pick another day, or take the next courier."` */
  emptyDescription?: string;

  /** Defaults: `standard` → "Standard", `express` → "Express". */
  tierLabels?: Partial<Record<DeliveryTier, string>>;
  /** Default `"Sold out"`. */
  soldOutLabel?: string;

  /** The colour the day strip's fade blends into. See `DeliverySlotDaysProps`. */
  fadeColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
