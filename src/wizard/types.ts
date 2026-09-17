import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** One step of a multi-step flow. */
export interface WizardStep {
  /** Stable key; defaults to the index. */
  key?: string;
  /** The step's title ("Photos"), drawn under the step count while it is current. */
  title: string;
  /** An optional line under the title ("Add at least five photos"). */
  description?: string;
}

export interface WizardProgressProps {
  /** Every step, in order. One bar segment each. */
  steps: ReadonlyArray<WizardStep>;
  /** The current step's index, 0-based. Clamped to the steps. */
  current: number;
  /**
   * How much of the current step is done, 0..1 — its segment fills this far.
   * Default `0.5`, so the current step always reads as "under way". Pass `0`
   * for an empty current segment, `1` once the step can be left.
   */
  currentProgress?: number;
  /** The count line. Default `` (position, total) => `Step ${position} of ${total}` ``. */
  formatStepCount?: (position: number, total: number) => string;
  /**
   * Hides the title and description, leaving the bar and the count — for a
   * screen whose own heading already names the step.
   */
  hideTitle?: boolean;
  /** Right of the count line, e.g. a "Save and exit" button. */
  action?: ReactNode;
  /** The heading level of the title on web. Default `1`. */
  headingLevel?: number;
  /**
   * The bar's accessible name. Default: the count line plus the title
   * ("Step 3 of 8, Photos").
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface WizardFooterProps {
  /** Called by the Back action. Omit it (the first step) to hide Back. */
  onBack?: () => void;
  /** Default `"Back"`. */
  backLabel?: string;
  backDisabled?: boolean;
  /** Called by the primary action. */
  onNext: () => void;
  /** Default `"Next"`; pass `"Publish"` on the last step. */
  nextLabel?: string;
  nextDisabled?: boolean;
  /** The primary action's own loading state: spinner, width kept, presses ignored. */
  loading?: boolean;
  /** A short line between the actions ("Saved a minute ago"). Hidden below 480 wide. */
  status?: string;
  /**
   * Pins the bar to the bottom of its scroll container on web
   * (`position: sticky`). Native has no sticky positioning: render the footer
   * after the `ScrollView`, outside it, and it stays put. Default `true`.
   */
  sticky?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
