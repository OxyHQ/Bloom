import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { ChatListItemLabels, ChatSearchResultsLabels } from './types';

/**
 * Every fixed string the chat-list family draws or announces, in each Bloom
 * language. Times and previews are pre-formatted by the caller; a caller's
 * `labels` / `*Label` prop still wins over any entry here.
 */
export interface ChatListMessages {
  /** `ChatListItem`'s glyph and marker names, and the draft lead-in. */
  item: Required<ChatListItemLabels>;
  /** `ChatSearchResults`' group headings and empty line. */
  search: Required<ChatSearchResultsLabels>;
  /** Names `ChatList`. */
  list: string;
  /** `ChatList`'s empty state. */
  emptyTitle: string;
  emptyDescription: string;
  /** Names `ChatSearchResults`' region. */
  searchResults: string;
  /** `ChatSearchField`'s name and its clear button. */
  searchChats: string;
  clearSearch: string;
  /** `NewChatButton`'s name and extended text. */
  newChat: string;
  /** `ArchivedRow`'s label. */
  archived: string;
  /** `ArchivedRow`'s name with a count: "Archived, 3 chats". */
  archivedName: (label: string, count: number) => string;
  /** A folder tab's name with a count: "Work, 3 unread". */
  folderName: (label: string, count: number) => string;
  /** Names `StoriesRow`. */
  stories: string;
  /** The first entry's name, and its + badge. */
  ownStory: string;
  addStory: string;
  /** A story ring's name: "Ana's story". */
  storyOf: (name: string) => string;
}

export const CHAT_LIST_MESSAGES: MessageCatalog<ChatListMessages> = defineMessages<ChatListMessages>('CHAT_LIST_MESSAGES', {
  item: { draft: 'Draft:', pinned: 'Pinned', muted: 'Muted', verified: 'Verified', channel: 'Channel', bot: 'Bot', group: 'Group' },
  search: { chat: 'Chats', message: 'Messages', contact: 'Contacts', empty: 'No results' },
  list: 'Chats',
  emptyTitle: 'No conversations yet',
  emptyDescription: 'Start a chat and it will show up here.',
  searchResults: 'Search results',
  searchChats: 'Search chats',
  clearSearch: 'Clear search',
  newChat: 'New chat',
  archived: 'Archived',
  archivedName: (label, n) => `${label}, ${plural('en', n, { one: '{n} chat', other: '{n} chats' })}`,
  folderName: (label, n) => `${label}, ${n} unread`,
  stories: 'Stories',
  ownStory: 'Your story',
  addStory: 'Add to your story',
  storyOf: (name) => `${name}'s story`,
});
