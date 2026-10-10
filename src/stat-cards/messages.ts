import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The stat cards' fixed words in each Bloom language. A stat's `hintLabel` and `caption` still win. */
export interface StatCardsMessages {
  /** The info glyph's name: "About Revenue". */
  about: (label: string) => string;
  /** The footer band's comparison caption. */
  fromLastMonth: string;
}

export const STAT_CARDS_MESSAGES: MessageCatalog<StatCardsMessages> =
  defineMessages<StatCardsMessages>('STAT_CARDS_MESSAGES', {
    about: (label) => `About ${label}`,
    fromLastMonth: 'From last month',
  });
