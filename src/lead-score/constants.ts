import type { TextStyle } from 'react-native';

import { RADIUS } from '../design-tokens/scales';
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
 * The tone paints the HEADER PANEL — the wash the label, the verdict and the
 * ring sit on — and the band's glyph. The verdict word beside it is
 * `title-1-medium` in the reading colour of that wash, the way every Bloom
 * score card draws a verdict, and the ring is the accent, because that is what
 * a meter means.
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
 * A glyph and no tone: the trend is a quiet icon-and-label line under the
 * verdict. The ARROW carries the direction, and the card keeps one tinted
 * thing — the header wash — rather than three competing ones.
 */
export const LEAD_SCORE_TREND: Record<LeadScoreTrend['direction'], { icon: BloomIconComponent }> = {
  up: { icon: RiArrowUpLine },
  down: { icon: RiArrowDownLine },
  flat: { icon: RiSubtractLine },
};

/**
 * Ring geometry: 132 across with a 10 stroke, CENTRED in the header panel.
 *
 * It is the largest thing on the card on purpose. At 72 beside the verdict it
 * was a widget in a corner, and the number inside it — the one fact the card
 * exists to state — was smaller than the word next to it.
 */
export const LEAD_SCORE_RING_SIZE = 132;
export const LEAD_SCORE_RING_THICKNESS = 10;

/** The card's inset, and the gap between its two panels. */
export const LEAD_SCORE_CARD_PADDING = 10;
export const LEAD_SCORE_PANEL_GAP = 10;

/** Both panels: the tinted header and the neutral one under it. */
export const LEAD_SCORE_PANEL_RADIUS = RADIUS['radius-16'];
export const LEAD_SCORE_PANEL_PADDING = 16;

/** One factor row: 12 of air above and below its single line. */
export const LEAD_FACTOR_ROW_PADDING = 12;
/** The square mark at the head of a factor row. */
export const LEAD_FACTOR_MARK_SIZE = 10;
export const LEAD_FACTOR_MARK_RADIUS = RADIUS['radius-4'];

/** Figures line up column-wise, so every number here is tabular. */
export const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };
