import type { TextStyle } from 'react-native';

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
 * The tone paints the band's GLYPH and nothing else — the verdict word beside
 * it is `title-1-medium` in the reading colour, the way every Bloom score card
 * draws a verdict. The measurement next to it is the accent, because that is
 * what a meter means.
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

/**
 * The trend arrow's glyph, per direction.
 *
 * A glyph and no tone: the trend is a quiet icon-and-label line in the
 * secondary rung, the shape `PriceEstimate` gives its confidence note. The
 * ARROW carries the direction, and the card keeps one tinted mark (the band's
 * glyph) rather than three competing ones.
 */
export const LEAD_SCORE_TREND: Record<LeadScoreTrend['direction'], { icon: BloomIconComponent }> = {
  up: { icon: RiArrowUpLine },
  down: { icon: RiArrowDownLine },
  flat: { icon: RiSubtractLine },
};

/** Ring geometry: 72 across with a 6 stroke, which carries a two-digit score and its scale. */
export const LEAD_SCORE_RING_SIZE = 72;
export const LEAD_SCORE_RING_THICKNESS = 6;

/** The factor rows: a 6-tall bar, and 24 between rows — `NeighbourhoodScores`' rhythm. */
export const LEAD_FACTOR_BAR_HEIGHT = 6;
export const LEAD_FACTOR_ROW_GAP = 24;

/** `PriceEstimate`'s card inset. */
export const LEAD_SCORE_CARD_PADDING = 20;

/** Figures line up column-wise, so every number here is tabular. */
export const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };
