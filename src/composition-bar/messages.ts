import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The selected block's readout, in each Bloom language. `formatReadout` still wins. */
export interface CompositionBarMessages {
  /** "120 pts · 35%": the block's points and its share, both already formatted. */
  readout: (points: string, percent: string) => string;
}

export const COMPOSITION_BAR_MESSAGES: MessageCatalog<CompositionBarMessages> =
  defineMessages<CompositionBarMessages>('COMPOSITION_BAR_MESSAGES', {
    readout: (points, percent) => `${points} pts · ${percent}`,
  });
