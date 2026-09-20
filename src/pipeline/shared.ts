/**
 * What the pipeline paints, and the pure helpers the components and their tests
 * both read.
 *
 * One resolver, asked once per PART, with the fill that part actually paints:
 * a column is a step off whatever is behind it (`surfaceFillOn`), a deal card is
 * the `card` role. Both then read their hairline and their three text rungs off
 * the colour they are really on, so the same column reads on a page, inside a
 * panel and inside a dialog without being told which one it is.
 */
import { interactiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { DEAL_HEALTH } from './constants';
import type { DealCardProps, DealHealth } from './types';

export interface PipelinePaint {
  /** The fill this part paints. Every other member is read off it. */
  surface: string;
  /** The rule under a column header, and a card's edge. */
  hairline: string;
  /** One step above `surface` — an empty state's tile, a skeleton block. */
  raised: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  ring: string;
}

/** Everything a pipeline part paints, given the fill it actually has. */
export function resolvePipelinePaint(theme: Theme, surface: string): PipelinePaint {
  const text = surfaceTextOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    raised: surfaceFillOn(theme, surface),
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
    ring: theme.colors.primary,
  };
}

/** A column's own fill: one step off whatever is behind the board. */
export function pipelineColumnFill(theme: Theme, behind: string): string {
  return surfaceFillOn(theme, behind);
}

/**
 * The health signal's word. `stalledFor` turns the stalled state into a
 * DURATION — "Stalled for 14 days" — and is ignored on every other health,
 * because a deal that is moving has not stalled for anything.
 */
export function dealHealthLabel(
  props: Pick<DealCardProps, 'health' | 'healthLabel' | 'stalledFor'>,
): string | null {
  const { health, healthLabel, stalledFor } = props;
  if (health === undefined) return healthLabel ?? null;
  if (healthLabel !== undefined) return healthLabel;
  if (health === 'stalled' && stalledFor) return `Stalled for ${stalledFor}`;
  return DEAL_HEALTH[health].label;
}

/** The tone a health draws in, or the neutral one when the card has no health. */
export function dealHealthTone(health: DealHealth | undefined): AccentTone {
  return health === undefined ? 'default' : DEAL_HEALTH[health].tone;
}

/** Joins the non-empty parts of an accessible name. */
export function joinDealName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(separator);
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web — the same mechanism `contact-card` uses, for the same
//  reason: a react-native-web `Pressable` is focusable with the outline reset,
//  and an inline style carries no `:focus-visible`.
// ---------------------------------------------------------------------------

export const PIPELINE_STYLE_ID = 'bloom-pipeline-web-css';

export const PIPELINE_WEB_CSS = interactiveWebCss({
  selector: '[data-bloom-deal-subject]',
  varPrefix: 'bloom-deal',
  reset: 'none',
  transition: 'background-color 150ms ease',
});
