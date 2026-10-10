/**
 * Lightweight entry for a single person row (a suggestion, a search result)
 * outside a contact list. Same `ContactRow` as `chat-people`, without linking
 * the lists, the group form or the story viewer in Metro, which does not
 * tree-shake barrel exports.
 */
export { ContactRow } from './ContactRow';
export type {
  ContactRowProps,
  ContactRowTrailing,
  PersonAvatarSource,
  PersonSummary,
} from './types';
