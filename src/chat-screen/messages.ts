import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the chat-screen family draws or announces, in each Bloom
 * language, except the common words (Back, Close, Delete, Copy, More options),
 * which come from `COMMON_MESSAGES`. A caller's `*Label` prop still wins.
 */
export interface ChatScreenMessages {
  /** `ChatHeader`'s call control. */
  call: string;
  videoCall: string;
  searchInConversation: string;
  /** The status line while the connection is down. */
  connecting: string;
  /** The title marker's names. */
  verified: string;
  bot: string;
  channel: string;
  /** Selection mode. */
  clearSelection: string;
  forward: string;
  pin: string;
  /** Selection mode's title: "3 selected". */
  selectedCount: (count: number) => string;
  /** `PinnedMessageBar`. */
  pinnedList: string;
  pinnedClose: string;
  pinnedUnpin: string;
  /** The bar's title for one pin. */
  pinnedMessage: string;
  /** The bar's title for pin `n` of several: "Pinned message #2". */
  pinnedMessageNumber: (n: number) => string;
  /** The round jump buttons. */
  scrollToBottom: string;
  jumpToMention: string;
  /** `ChatEmptyState`'s default title. */
  emptyTitle: string;
  /** `ChatInfoPanel`. */
  info: string;
  members: string;
  addMember: string;
  memberSearch: string;
  noMembers: string;
  /** Role badges. */
  owner: string;
  admin: string;
  /** `ChatSplitLayout`'s divider. */
  resizeList: string;
}

export const CHAT_SCREEN_MESSAGES: MessageCatalog<ChatScreenMessages> =
  defineMessages<ChatScreenMessages>('CHAT_SCREEN_MESSAGES', {
    call: 'Call',
    videoCall: 'Video call',
    searchInConversation: 'Search in conversation',
    connecting: 'Connecting…',
    verified: 'Verified',
    bot: 'Bot',
    channel: 'Channel',
    clearSelection: 'Clear selection',
    forward: 'Forward',
    pin: 'Pin',
    selectedCount: (n) => plural('en', n, { one: '{n} selected', other: '{n} selected' }),
    pinnedList: 'Show pinned messages',
    pinnedClose: 'Hide the pinned bar',
    pinnedUnpin: 'Unpin this message',
    pinnedMessage: 'Pinned message',
    pinnedMessageNumber: (n) => `Pinned message #${n}`,
    scrollToBottom: 'Scroll to latest messages',
    jumpToMention: 'Jump to mention',
    emptyTitle: 'No messages yet',
    info: 'Info',
    members: 'Members',
    addMember: 'Add members',
    memberSearch: 'Search members',
    noMembers: 'No members found',
    owner: 'Owner',
    admin: 'Admin',
    resizeList: 'Resize the conversation list',
  });
