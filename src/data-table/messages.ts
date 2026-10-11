import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the data-table family draws or announces, in each Bloom
 * language. The search field and the row-actions menu speak the common words
 * (`Search`, `More actions`); a caller's `*Label` props still win over these.
 */
export interface DataTableMessages {
  /** The header checkbox's name. */
  selectAll: string;
  /** A row checkbox's name, about the row's id. */
  selectRow: (rowId: string) => string;
  /** The density control's name. */
  densityLabel: string;
  /** The density control's two segments. */
  density: { md: string; sm: string };
}

export const DATA_TABLE_MESSAGES: MessageCatalog<DataTableMessages> =
  defineMessages<DataTableMessages>('DATA_TABLE_MESSAGES', {
    selectAll: 'Select all rows on this page',
    selectRow: (id) => `Select row ${id}`,
    densityLabel: 'Table density',
    density: { md: 'Normal', sm: 'Compact' },
  });
