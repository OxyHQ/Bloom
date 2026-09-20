import { RiArrowDownLine } from '../icons/remix/RiArrowDownLine';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { RiSnowflakeLine } from '../icons/remix/RiSnowflakeLine';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { RiTempHotLine } from '../icons/remix/RiTempHotLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';
import type { LeadScoreBand, LeadScoreTrend } from './types';

/**
 * The band's tone, word and glyph.
 *
 * `hot` is the SUCCESS tone, not the error one: a hot lead is the good outcome,
 * and reading temperature as danger is exactly the confusion a tone vocabulary
 * exists to prevent.
 */
export const LEAD_SCORE_BAND: Record<
  LeadScoreBand,
  { tone: AccentTone; label: string; icon: BloomIconComponent }
> = {
  cold: { tone: 'info', label: 'Cold', icon: RiSnowflakeLine },
  warm: { tone: 'warning', label: 'Warm', icon: RiTempHotLine },
  hot: { tone: 'success', label: 'Hot', icon: RiFireLine },
};

/**
 * Where one band ends and the next begins, as a FRACTION of `max` — so a
 * 0–100 score and a 0–5 one land in the same places. An app with its own
 * thresholds passes `band` and skips this entirely.
 */
export const LEAD_SCORE_THRESHOLDS = { warm: 0.4, hot: 0.7 } as const;

/** The trend arrow's glyph and tone. `flat` is neutral, not "slightly bad". */
export const LEAD_SCORE_TREND: Record<
  LeadScoreTrend['direction'],
  { icon: BloomIconComponent; tone: AccentTone }
> = {
  up: { icon: RiArrowUpLine, tone: 'success' },
  down: { icon: RiArrowDownLine, tone: 'error' },
  flat: { icon: RiSubtractLine, tone: 'default' },
};

/** The tone a factor draws in. A factor is a contribution, not a status. */
export const LEAD_FACTOR_TONE = { positive: 'success', negative: 'error' } as const;

/** Ring geometry: 96 across with an 8 stroke, which carries a two-digit score. */
export const LEAD_SCORE_RING_SIZE = 96;
export const LEAD_SCORE_RING_THICKNESS = 8;

/** The factor bars. */
export const LEAD_FACTOR_BAR_HEIGHT = 6;
export const LEAD_SCORE_CARD_PADDING = 16;
