import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The hover card's default accessible name, in each Bloom language. A caller's
 * `label` still wins.
 */
export interface HoverCardMessages {
  hoverCard: string;
}

export const HOVER_CARD_MESSAGES: MessageCatalog<HoverCardMessages> =
  defineMessages<HoverCardMessages>('HOVER_CARD_MESSAGES', {
    hoverCard: 'Hover card',
  });
