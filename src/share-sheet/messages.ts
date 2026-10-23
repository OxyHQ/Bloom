import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the share sheet draws or announces, in each Bloom
 * language. The caller's `title`, `search.placeholder` and `peopleEmpty` still
 * win over these.
 */
export interface ShareSheetMessages {
  /** The heading. */
  title: string;
  /** Names the people grid and the targets row for a screen reader. */
  people: string;
  targets: string;
  /** A person's tile: "Send to Ana". */
  sendTo: (name: string) => string;
  /** `people` is empty and nothing is loading. */
  noPeople: string;
}

export const SHARE_SHEET_MESSAGES: MessageCatalog<ShareSheetMessages> =
  defineMessages<ShareSheetMessages>('SHARE_SHEET_MESSAGES', {
    title: 'Share',
    people: 'Send to',
    targets: 'Share to',
    sendTo: (name) => `Send to ${name}`,
    noPeople: 'No one found',
  });
