import type { ImageSource } from '../shapes';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * One turn of the transcript. Bloom renders text only — reasoning and tool
 * parts of a model message are the consumer's to fold into `text` or ignore.
 */
export interface AgentChatMessageData {
  id: string;
  /** `'user'` renders the right-aligned bubble; anything else is an assistant reply. */
  role: 'user' | 'assistant' | (string & {});
  text: string;
  /** Epoch ms the message arrived, for the hover timestamp ("3 minutes ago"). */
  at?: number;
}

/**
 * `ready` idle · `submitted` sent, nothing streamed yet · `streaming` tokens
 * arriving · `error` the last request failed. The AI SDK's `useChat().status`
 * values, so it can be passed straight through.
 */
export type AgentChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

/** A thread in the history rail. */
export interface AgentChatThread {
  id: string;
  title: string;
  /** Epoch ms of the last message; drives the compact age badge (`now`, `34m`, `5h`, `3d`). */
  updatedAt: number;
  unread?: boolean;
}

// ---------------------------------------------------------------------------
//  AgentChatMessage
// ---------------------------------------------------------------------------

export interface AgentChatMessageLabels {
  /** `'Copy message'` in English. */
  copy?: string;
  /** `'Copied'` in English. */
  copied?: string;
  /** `'Read aloud'` in English. */
  readAloud?: string;
  /** `'Stop reading aloud'` in English. */
  stopReading?: string;
}

export interface AgentChatMessageProps {
  role: AgentChatMessageData['role'];
  text: string;
  /** True while this message is still being streamed — hides the action row. */
  streaming?: boolean;
  /** When the message first appeared, for the timestamp beside the actions. */
  at?: number;
  /**
   * Copy handler. Resolve (or return) to show the ✓ for 1.6s; throw to leave
   * the icon unchanged. Default on web: `navigator.clipboard.writeText`. With no
   * handler on native the copy button is not rendered.
   */
  onCopy?: (text: string) => void | Promise<void>;
  /**
   * Read-aloud handler: called with `true` to start and `false` to stop. Default
   * on web: `speechSynthesis`. With no handler on native the button is not
   * rendered.
   */
  onReadAloud?: (text: string, start: boolean) => void;
  /** Controlled "reading aloud" state, for a consumer-owned speech engine. */
  readingAloud?: boolean;
  /** "just now", "3 minutes ago"… Default: `formatAgo` in the locale's words. */
  formatTime?: (at: number) => string;
  labels?: AgentChatMessageLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AgentChatActions
// ---------------------------------------------------------------------------

export interface AgentChatActionsLabels {
  /** `'Share chat'` in English. */
  share?: string;
  /** `'Transcript copied'` in English. */
  shared?: string;
  /** `'More actions for this chat'` in English. */
  more?: string;
  /** `'Export chats'` in English. */
  exportChats?: string;
  /** `'Mark as unread'` in English. */
  markUnread?: string;
  /** `'Delete chat'` in English. */
  deleteChat?: string;
}

export interface AgentChatActionsProps {
  /** Plain-text transcript of the open chat, for share. */
  transcript: string;
  /**
   * Share handler. Return `'copied'` (or resolve to it) to show the ✓ for 1.6s.
   * Default on web: the Web Share sheet, else the clipboard (which shows the ✓).
   */
  onShare?: (transcript: string) => void | 'copied' | Promise<void | 'copied'>;
  onExport?: () => void;
  onToggleUnread?: () => void;
  onDelete?: () => void;
  /** No chat open yet, so there is nothing to act on. */
  disabled?: boolean;
  labels?: AgentChatActionsLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AgentChatHistory
// ---------------------------------------------------------------------------

/** A measured line under "Usage left" in the account menu. */
export interface AgentChatUsageRow {
  label: string;
  value: string;
  /** 0–100. */
  percent: number;
}

/** A plain row of the account menu (icon + label). */
export interface AgentChatAccountMenuItem {
  key: string;
  label: string;
  /** A Remix-style icon component taking `width`/`height`/`fill`. */
  icon?: BloomIconComponent;
  onPress?: () => void;
}

export interface AgentChatAccount {
  name: string;
  /** Initials for the avatar disc. Default: the name's first letter. */
  initials?: string;
  avatar?: string | ImageSource;
}

export interface AgentChatHistoryLabels {
  /** `'Chat history'` in English. */
  region?: string;
  /** `'New chat'` in English. */
  newChat?: string;
  /** `'Recent'` in English. */
  recent?: string;
  /** `'Chats you start show up here.'` in English. */
  empty?: string;
  /** `'Rename'` in English. */
  rename?: string;
  /** `'Rename chat'` in English (the rename field's name). */
  renameField?: string;
  /** `'Mark as unread'` in English. */
  markUnread?: string;
  /** `'Delete'` in English. */
  delete?: string;
  /** `'Unread'` in English. */
  unread?: string;
  /** "More actions for {title}" in English. */
  moreFor?: (title: string) => string;
  /** "No chats to export" / "Export {count} chats" in English. */
  exportCount?: (count: number) => string;
  /** "{name} account menu" in English. */
  accountMenu?: (name: string) => string;
  /** `'Usage left'` in English. */
  usageLeft?: string;
  /** `'Upgrade to Max'` in English. */
  upgrade?: string;
  /** `'Log out'` in English. */
  logOut?: string;
}

export interface AgentChatHistoryProps {
  threads: ReadonlyArray<AgentChatThread>;
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  onRename?: (id: string, title: string) => void;
  onToggleUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Downloads the stored chats. The footer's export disc is shown when set. */
  onExport?: () => void;
  /** Disables switching mid-stream, which would strand the running response. */
  disabled?: boolean;
  /** The account strip at the foot of the rail. Omit to hide the menu trigger. */
  account?: AgentChatAccount;
  /** "Usage left" section rows. Omit to drop the section. */
  usage?: ReadonlyArray<AgentChatUsageRow>;
  /** Shows "Upgrade to Max" under the usage rows. */
  onUpgrade?: () => void;
  /** Rows between the usage section and the divider ("Invite a friend", "Settings"). */
  accountItems?: ReadonlyArray<AgentChatAccountMenuItem>;
  /** Shows the divider and "Log out". */
  onLogOut?: () => void;
  /** Compact age badge. Default: `relativeTime` in the locale's words (`now`, `34m`, `5h`, `3d`). */
  formatAge?: (at: number) => string;
  labels?: AgentChatHistoryLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AgentChatComposer
// ---------------------------------------------------------------------------

export interface AgentChatComposerLabels {
  /** `'Message'` in English (the field's accessible name). */
  field?: string;
  /** `'Ask me anything'` in English. */
  placeholder?: string;
  /** `'Add attachment'` in English. */
  attach?: string;
  /** `'Send message'` in English. */
  send?: string;
  /** `'Stop generating'` in English. */
  stop?: string;
  /** `'Not configured'` in English (status row, no provider). */
  notConfigured?: string;
  /** `'New chat'` in English (status row, no messages). */
  newChat?: string;
  /** "{count} messages" in English. */
  messageCount?: (count: number) => string;
  /** "Answering with {model}" in English. */
  answeringWith?: (model: string) => string;
}

export interface AgentChatComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Enter or the send disc. Receives the current text. */
  onSubmit?: (text: string) => void;
  onStop?: () => void;
  /** Shows the stop disc and lights the `ComposerLoader` band. */
  busy?: boolean;
  /** Pressing the paperclip. The disc is always drawn. */
  onAttach?: () => void;
  /** Model id, e.g. `"openai/gpt-5-nano"` — shown as `gpt-5-nano` with a sparkle. */
  model?: string | null;
  /** Provider shown in the status row ("Anthropic", "Demo mode"). */
  provider?: string | null;
  messageCount?: number;
  disabled?: boolean;
  labels?: AgentChatComposerLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AgentChat
// ---------------------------------------------------------------------------

export interface AgentChatLabels {
  /** Header title fallback. `'New chat'` in English. */
  newChat?: string;
  /** Empty-state heading. `'What can I help with?'` in English. */
  emptyTitle?: string;
  /** Empty-state line. In English "This chat runs against your own API key…". */
  emptyDescription?: string;
  /** Status label beside the thinking dots. `'Thinking'` in English. */
  thinking?: string;
  /** `'Something went wrong. Check the server logs, then try again.'` in English. */
  error?: string;
}

export interface AgentChatProps {
  messages: ReadonlyArray<AgentChatMessageData>;
  /** Default `'ready'`. `submitted`/`streaming` are "busy". */
  status?: AgentChatStatus;
  /** Shows the error line under the transcript. Default: `status === 'error'`. */
  error?: boolean;
  /** Header title. Default: the active thread's title, else `labels.newChat`. */
  title?: string;

  /** Composer text, controlled. Uncontrolled when omitted (cleared on submit). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** A trimmed, non-empty message while not busy — from the composer or a suggestion. */
  onSubmit?: (text: string) => void;
  onStop?: () => void;
  onAttach?: () => void;
  model?: string | null;
  provider?: string | null;

  /** Suggestion pills in the empty state. Default three (localised). `[]` hides them. */
  suggestions?: ReadonlyArray<string>;
  /** Replaces the whole empty state (e.g. an "Add an API key" notice). */
  emptyState?: ReactNode;

  /** Leading header slot — a phone nav toggle mounts here. */
  headerLeading?: ReactNode;

  // Actions (header, right)
  onShare?: AgentChatActionsProps['onShare'];
  /** Also shown in the history rail footer. */
  onExport?: () => void;
  onCopyMessage?: AgentChatMessageProps['onCopy'];
  onReadAloud?: AgentChatMessageProps['onReadAloud'];

  // History rail
  /** Omit to hide the rail. */
  threads?: ReadonlyArray<AgentChatThread>;
  activeThreadId?: string;
  onSelectThread?: (id: string) => void;
  onNewChat?: () => void;
  onRenameThread?: (id: string, title: string) => void;
  onToggleUnread?: (id: string) => void;
  onDeleteThread?: (id: string) => void;
  /**
   * Show the history rail. Default: when `threads` is given AND the window is at
   * least 1280 wide.
   */
  showHistory?: boolean;
  /** Rail props that are not wired above (account, usage, labels…). */
  historyProps?: Partial<
    Omit<
      AgentChatHistoryProps,
      | 'threads'
      | 'activeId'
      | 'onSelect'
      | 'onNewChat'
      | 'onRename'
      | 'onToggleUnread'
      | 'onDelete'
      | 'onExport'
      | 'disabled'
    >
  >;
  labels?: AgentChatLabels;
  actionsLabels?: AgentChatActionsLabels;
  composerLabels?: AgentChatComposerLabels;
  messageLabels?: AgentChatMessageLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
