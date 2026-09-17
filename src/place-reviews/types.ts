import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ReviewCategory } from '../listing-details/types';

/** A category score on a place review ("Landlord responsiveness", 4). */
export interface PlaceReviewCategoryRating {
  label: string;
  /** 0..5. */
  value: number;
  /** Default `value.toFixed(1)`. */
  display?: string;
}

export interface PlaceReviewCardProps {
  /**
   * The ANONYMISED author line ("Tenant, 2021–2023"). Reviews of a building
   * outlive a tenancy and can reach a landlord, so the card has no name field.
   */
  authorLabel: string;
  /** A single letter drawn in the avatar disc. Without it no avatar is drawn. */
  authorInitial?: string;
  /** Pre-formatted ("Reviewed March 2026"). */
  date?: string;
  /** The overall rating, 0..5. */
  rating: number;
  categories?: readonly PlaceReviewCategoryRating[];
  /** `true`/`false` draw the deposit chip; `undefined` draws nothing (not known, or not asked). */
  depositReturned?: boolean;
  /** Default `"Deposit returned"`. */
  depositReturnedLabel?: string;
  /** Default `"Deposit not returned"`. */
  depositNotReturnedLabel?: string;
  /** `true`/`false` draw the recommendation chip. */
  wouldRecommend?: boolean;
  /** Default `"Would recommend"`. */
  recommendLabel?: string;
  /** Default `"Wouldn't recommend"`. */
  notRecommendLabel?: string;
  text: string;
  /** Clamp the text until expanded. Default `4`; `0` never clamps. */
  numberOfLines?: number;
  /** Default `"Show more"`. */
  showMoreLabel?: string;
  /** Default `"Show less"`. */
  showLessLabel?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** How many people found it helpful. */
  helpfulCount?: number;
  /** Whether the viewer marked it helpful. Draws the toggle with `onHelpfulChange`. */
  helpful?: boolean;
  onHelpfulChange?: (helpful: boolean) => void;
  /** Default `"Helpful"`. */
  helpfulLabel?: string;
  onReport?: () => void;
  /** Default `"Report"`. */
  reportLabel?: string;
  /** `auto` (default) draws the categories in 2 columns from 520 wide. */
  layout?: 'auto' | 'wide' | 'narrow';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PlaceReviewSummaryProps {
  /** The overall rating. */
  rating: number | string;
  /** A line beside the number ("Rated by past tenants"). */
  title?: string;
  /** The number of reviews. A string is drawn as given. */
  reviewCount?: number | string;
  /** Default `(n) => \`${n} reviews\`` (`"1 review"` for 1). */
  formatReviewCount?: (count: number | string) => string;
  /** Housing categories; icons optional. */
  categories?: readonly ReviewCategory[];
  /**
   * Share of tenancies whose deposit came back, 0..1. The one number this part
   * computes: it is rounded to a whole percent for the stat line.
   */
  depositReturnedRate?: number;
  /** Default `(percent) => \`Deposit returned in ${percent}% of tenancies\``. */
  formatDepositReturned?: (percent: number) => string;
  /** Share of reviewers who would recommend, 0..1. */
  recommendRate?: number;
  /** Default `(percent) => \`${percent}% would recommend living here\``. */
  formatRecommend?: (percent: number) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface WriteReviewPromptProps {
  /** The building's title ("Calle del Olmo 14"). */
  buildingTitle: string;
  /** Default `"Did you live here?"`. */
  title?: string;
  /** Default `` `Help future tenants of ${buildingTitle}. Reviews are anonymous.` ``. */
  description?: string;
  /** Default `"Write a review"`. */
  actionLabel?: string;
  onStart: () => void;
  /** Draws a close button. */
  onDismiss?: () => void;
  /** Default `"Dismiss"`. */
  dismissLabel?: string;
  /** Replaces the building icon tile. */
  media?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
