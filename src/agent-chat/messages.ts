import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the agent-chat family draws or announces, in each Bloom
 * language. The common words (Delete, Copied, "More actions for …") come from
 * `COMMON_MESSAGES`; a caller's `labels` props still win over any entry here.
 */
export interface AgentChatMessages {
  chat: {
    /** Header title fallback. */
    newChat: string;
    emptyTitle: string;
    emptyDescription: string;
    thinking: string;
    error: string;
    /** The empty state's suggestion pills. */
    suggestions: readonly string[];
    /** Speaker names in a shared transcript. */
    you: string;
    assistant: string;
  };
  actions: {
    share: string;
    shared: string;
    more: string;
    exportChats: string;
    markUnread: string;
    deleteChat: string;
  };
  message: {
    copy: string;
    readAloud: string;
    stopReading: string;
  };
  history: {
    region: string;
    recent: string;
    empty: string;
    rename: string;
    renameField: string;
    markUnread: string;
    unread: string;
    exportCount: (count: number) => string;
    accountMenu: (name: string) => string;
    usageLeft: string;
    upgrade: string;
    logOut: string;
  };
  composer: {
    field: string;
    placeholder: string;
    attach: string;
    send: string;
    stop: string;
    notConfigured: string;
    messageCount: (count: number) => string;
    answeringWith: (model: string) => string;
  };
  /** A message's age: "just now", "3 minutes ago". */
  ago: {
    justNow: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  };
  /** A rail row's compact age badge: "now", "34m", "5h", "3d". */
  age: {
    now: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  };
}

export const AGENT_CHAT_MESSAGES: MessageCatalog<AgentChatMessages> = defineMessages<AgentChatMessages>('AGENT_CHAT_MESSAGES', {
  chat: {
    newChat: 'New chat',
    emptyTitle: 'What can I help with?',
    emptyDescription: 'This chat runs against your own API key. History stays in this browser.',
    thinking: 'Thinking',
    error: 'Something went wrong. Check the server logs, then try again.',
    suggestions: [
      'Explain what this starter does',
      'Write a product update in three sentences',
      'Give me five names for a scheduling app',
    ],
    you: 'You',
    assistant: 'Assistant',
  },
  actions: {
    share: 'Share chat',
    shared: 'Transcript copied',
    more: 'More actions for this chat',
    exportChats: 'Export chats',
    markUnread: 'Mark as unread',
    deleteChat: 'Delete chat',
  },
  message: { copy: 'Copy message', readAloud: 'Read aloud', stopReading: 'Stop reading aloud' },
  history: {
    region: 'Chat history',
    recent: 'Recent',
    empty: 'Chats you start show up here.',
    rename: 'Rename',
    renameField: 'Rename chat',
    markUnread: 'Mark as unread',
    unread: 'Unread',
    exportCount: (n) =>
      n === 0 ? 'No chats to export' : plural('en', n, { one: 'Export {n} chat', other: 'Export {n} chats' }),
    accountMenu: (name) => `${name} account menu`,
    usageLeft: 'Usage left',
    upgrade: 'Upgrade to Max',
    logOut: 'Log out',
  },
  composer: {
    field: 'Message',
    placeholder: 'Ask me anything',
    attach: 'Add attachment',
    send: 'Send message',
    stop: 'Stop generating',
    notConfigured: 'Not configured',
    messageCount: (n) => plural('en', n, { one: '{n} message', other: '{n} messages' }),
    answeringWith: (model) => `Answering with ${model}`,
  },
  ago: {
    justNow: 'just now',
    minutes: (n) => plural('en', n, { one: '{n} minute ago', other: '{n} minutes ago' }),
    hours: (n) => plural('en', n, { one: '{n} hour ago', other: '{n} hours ago' }),
    days: (n) => plural('en', n, { one: '{n} day ago', other: '{n} days ago' }),
  },
  age: { now: 'now', minutes: (n) => `${n}m`, hours: (n) => `${n}h`, days: (n) => `${n}d` },
});
