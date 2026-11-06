import { defineMessages, type MessageCatalog } from '../locale/messages';

/** Every fixed string the sortable chip row announces, in each Bloom language. */
export interface SortableChipRowMessages {
  moveEarlier: (label: string) => string;
  moveLater: (label: string) => string;
}

export const SORTABLE_CHIP_ROW_MESSAGES: MessageCatalog<SortableChipRowMessages> =
  defineMessages<SortableChipRowMessages>('SORTABLE_CHIP_ROW_MESSAGES', {
    moveEarlier: (label) => `Move ${label} earlier`,
    moveLater: (label) => `Move ${label} later`,
  });
