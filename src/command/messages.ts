import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the command palette draws or announces, in each Bloom
 * language. A caller's `placeholder` / `emptyText` still wins.
 */
export interface CommandMessages {
  /** The search field's placeholder, and its name. */
  placeholder: string;
  /** Shown when no item matches. */
  empty: string;
  /** Names the dialog. */
  palette: string;
  /** Names the button that clears the query. */
  clearSearch: string;
}

export const COMMAND_MESSAGES: MessageCatalog<CommandMessages> = defineMessages<CommandMessages>('COMMAND_MESSAGES', {
  placeholder: 'Type a command or search…',
  empty: 'No results found.',
  palette: 'Command palette',
  clearSearch: 'Clear search',
});
