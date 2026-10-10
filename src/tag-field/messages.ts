import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * `TagField`'s fixed words, in each Bloom language. Each entry of the
 * `labels` prop still wins over its counterpart here.
 */
export interface TagFieldMessages {
  /** A chip's remove button: "Remove design". */
  remove: (tag: string) => string;
  /** The hint once `max` tags are in: "5 maximum". */
  full: (max: number) => string;
  /** The suggestion list's name. */
  suggestions: string;
}

export const TAG_FIELD_MESSAGES: MessageCatalog<TagFieldMessages> =
  defineMessages<TagFieldMessages>('TAG_FIELD_MESSAGES', {
    remove: (t) => `Remove ${t}`,
    full: (n) => `${n} maximum`,
    suggestions: 'Suggestions',
  });
