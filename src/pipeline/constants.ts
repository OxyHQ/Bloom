import { RiAlarmWarningLine } from '../icons/remix/RiAlarmWarningLine';
import { RiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';
import type { DealHealth } from './types';

/**
 * The one health signal, as a tone, a word and a glyph.
 *
 * A tone rather than a colour: `resolveAccentColors` owns what "warning" looks
 * like on the surface the card lands on, in both modes and in all 64 presets,
 * and a card that picked a red would be wrong in half of them.
 */
export const DEAL_HEALTH: Record<
  DealHealth,
  { tone: AccentTone; label: string; icon: BloomIconComponent }
> = {
  'on-track': { tone: 'success', label: 'On track', icon: RiCheckboxCircleLine },
  'at-risk': { tone: 'warning', label: 'At risk', icon: RiAlarmWarningLine },
  stalled: { tone: 'error', label: 'Stalled', icon: RiTimeLine },
};

/** Card geometry. */
export const DEAL_CARD_PADDING = 12;

/** Column geometry: the pad inside a column, and the gap between its cards. */
export const PIPELINE_COLUMN_PADDING = 12;
export const PIPELINE_CARD_GAP = 8;

/**
 * A column is 288 wide on a board — wide enough for an amount and a close date
 * on one line at the card's type ramp, narrow enough that three fit a 960 pane.
 */
export const PIPELINE_COLUMN_WIDTH = 288;

/**
 * At or below 700 the board draws ONE column at a time. Measured on the column:
 * two 288 columns plus the 12 gap and the board's own gutters need 620, and a
 * board that shows one and a half columns reads as broken rather than as
 * scrollable.
 */
export const PIPELINE_SINGLE_MAX_WIDTH = 700;

/** Placeholder cards drawn while a column is loading. */
export const PIPELINE_SKELETON_CARDS = 3;
