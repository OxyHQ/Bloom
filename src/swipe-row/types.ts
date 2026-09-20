import type { ReactNode } from 'react';

import type { BloomIconComponent } from '../icons/icon-component';

/** How loudly a pane is painted. */
export type SwipeRowActionTone = 'neutral' | 'accent' | 'negative';

/** One action behind a row. */
export interface SwipeRowAction {
  /** Stable identity, and what `onAction` reports. */
  key: string;
  /** The caption under the glyph AND the action's accessible name. */
  label: string;
  icon: BloomIconComponent;
  /** Default `'neutral'`. */
  tone?: SwipeRowActionTone;
  /** Called on its own, in addition to the row's `onAction`. */
  onPress?: () => void;
}

/**
 * The two panes. `left` is uncovered by dragging RIGHT (it enters from the left
 * edge) and `right` by dragging left — the side names the EDGE the pane is
 * anchored to, not the direction of the finger.
 */
export interface SwipeRowActions {
  left?: readonly SwipeRowAction[];
  right?: readonly SwipeRowAction[];
}

/**
 * The three pane pairs, background and what is legible on it.
 *
 * A family with its own resolved palette (a chat row, a mail row) passes the
 * pairs it already computed, so its panes match the rest of the row exactly;
 * everything else lets {@link resolveSwipeRowPaint} read them off the theme.
 */
export interface SwipeRowPaint {
  neutral: string;
  onNeutral: string;
  accent: string;
  onAccent: string;
  negative: string;
  onNegative: string;
}

export interface SwipeRowProps {
  /** What is behind the row on each side. A side with no actions cannot open. */
  actions: SwipeRowActions;
  /** Called with the action's `key` when one is pressed. */
  onAction?: (key: string) => void;
  /**
   * An exact height for the container. Omit it for a row that sizes itself —
   * the panes stretch to whatever the child turns out to be.
   */
  height?: number;
  /** Defaults to {@link resolveSwipeRowPaint} of the active theme. */
  paint?: SwipeRowPaint;
  /**
   * The fill the travelling row is painted on. Defaults to the theme's page
   * colour.
   *
   * It is NOT decoration. The panes are laid UNDER the row, so a row with a
   * transparent background lets them show straight through it as it moves —
   * the delete pane reading through the subject line. A row that sits on a card
   * passes that card's fill.
   */
  background?: string;
  /** The radius the panes are clipped to. Default {@link SWIPE_ROW_RADIUS}. */
  radius?: number;
  /** How wide one action is. Default {@link SWIPE_ACTION_WIDTH}. */
  actionWidth?: number;
  /** Names the tap target that closes an open pane. Default `'Close actions'`. */
  closeLabel?: string;
  /** Fires whenever a pane settles open or closed. */
  onOpenChange?: (side: 'left' | 'right' | null) => void;
  children: ReactNode;
  testID?: string;
}
