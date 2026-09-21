import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * How loud the block is, which is a question about WHERE it is, not about how
 * much there is to say.
 *
 * `comfortable` is the screen rung: a 32 glyph, a headline, 48 of air above and
 * below. `compact` is the PANEL rung — a side panel, a popover, a card that is
 * already inside something — where the same three lines have to read without
 * pushing the panel's own chrome off screen: a 24 glyph, a body title, 24 of
 * air. Nothing else changes, so a list that moves from a screen into a panel
 * does not change components.
 */
export type EmptyStateVariant = 'comfortable' | 'compact';

/**
 * What the glyph is drawn ON.
 *
 * `glyph` is the bare mark in the graphical rung — the shape twelve of Bloom's
 * lists already draw by hand. `circle` is `IconCircle`, the tinted disc: it is
 * LOUDER, and it is right when the empty state is the whole screen or is
 * inviting an action rather than reporting a count. There is no third: a well
 * with a neutral fill and a tinted disc side by side were two answers to the
 * same question.
 */
export type EmptyStateMedia = 'glyph' | 'circle';

/**
 * One of the two actions, as DATA.
 *
 * A node would have worked, and the six hand-rolled empties this family
 * replaces each passed one — which is how three of them ended up with three
 * different button sizes for the same "there is nothing here, do this" button.
 * As data, the family owns the size, the order and the wrap, and the caller
 * still owns the words and the handler. Anything that is not a button goes in
 * `footer`.
 */
export interface EmptyStateAction {
  /** The words on the button. Also its accessible name. */
  label: string;
  onPress?: () => void;
  /** A glyph before the label. */
  icon?: BloomIconComponent;
  disabled?: boolean;
  /** Spinner in the button; presses are ignored. */
  loading?: boolean;
  /** Overrides the announced name — for a label that reads as a fragment. */
  accessibilityLabel?: string;
  testID?: string;
}

export interface EmptyStateProps {
  /**
   * The glyph. Omit it (and `illustration`) for a block that is text only —
   * a table band, a search result count — which is a real shape and not a
   * degraded one.
   */
  icon?: BloomIconComponent;
  /** Default `glyph`. Ignored when `illustration` is set. */
  media?: EmptyStateMedia;
  /**
   * An arbitrary mark above the title — an image, a `Skeleton` stack, an
   * `AnimatedCheck`. WINS over `icon`, and takes no tile of its own: whatever
   * is passed is drawn exactly as it comes.
   */
  illustration?: ReactNode;
  /** "Nothing here yet". A block with no title is a single explanatory line. */
  title?: string;
  /** The one line that says why, and what would change it. */
  description?: string;
  /** The thing to do about it. */
  action?: EmptyStateAction;
  /** The other thing to do about it. Drawn beside `action`, quieter. */
  secondaryAction?: EmptyStateAction;
  /**
   * Anything between the explanation and the actions — a reference chip, a
   * status strip, a list of facts. Stretched to the block's full width and
   * left to lay itself out, because the things that go here are not centred
   * text.
   */
  children?: ReactNode;
  /** Under the actions: a note, a link, a row of suggestions. Centred. */
  footer?: ReactNode;
  /** Default `comfortable`. */
  variant?: EmptyStateVariant;
  /**
   * A floor for the block, for an empty state that has to hold a band open —
   * a table body, a panel that must not collapse. The content centres in it.
   */
  minHeight?: number;
  /**
   * Names the block. Defaults to the title, so a screen reader reaches one
   * named `group` instead of three unrelated strings.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
