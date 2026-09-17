import type { ComponentType, ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

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
  /** Default `'Copy message'`. */
  copy?: string;
  /** Default `'Copied'`. */
  copied?: string;
  /** Default `'Read aloud'`. */
  readAloud?: string;
  /** Default `'Stop reading aloud'`. */
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
  /** "just now", "3 minutes ago"… Default: `formatAgo`. */
  formatTime?: (at: number) => string;
  labels?: AgentChatMessageLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AgentChatActions
// ---------------------------------------------------------------------------

export interface AgentChatActionsLabels {
  /** Default `'Share chat'`. */
  share?: string;
  /** Default `'Transcript copied'`. */
  shared?: string;
  /** Default `'More actions for this chat'`. */
  more?: string;
  /** Default `'Export chats'`. */
  exportChats?: string;
  /** Default `'Mark as unread'`. */
  markUnread?: string;
  /** Default `'Delete chat'`. */
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
  icon?: ComponentType<{ width?: number; height?: number; fill?: string }>;
  onPress?: () => void;
}

export interface AgentChatAccount {
  name: string;
  /** Initials for the avatar disc. Default: the name's first letter. */
  initials?: string;
  avatar?: string | ImageSourcePropType;
}

export interface AgentChatHistoryLabels {
  /** Default `'Chat history'`. */
  region?: string;
  /** Default `'New chat'`. */
  newChat?: string;
  /** Default `'Recent'`. */
  recent?: string;
  /** Default `'Chats you start show up here.'`. */
  empty?: string;
  /** Default `'Rename'`. */
  rename?: string;
  /** Default `'Rename chat'` (the rename field's name). */
  renameField?: string;
  /** Default `'Mark as unread'`. */
  markUnread?: string;
  /** Default `'Delete'`. */
  delete?: string;
  /** Default `'Unread'`. */
  unread?: string;
  /** Default `(title) => \`More actions for ${title}\``. */
  moreFor?: (title: string) => string;
  /** Default `(count) => count === 0 ? 'No chats to export' : \`Export ${count} chats\``. */
  exportCount?: (count: number) => string;
  /** Default `(name) => \`${name} account menu\``. */
  accountMenu?: (name: string) => string;
  /** Default `'Usage left'`. */
  usageLeft?: string;
  /** Default `'Upgrade to Max'`. */
  upgrade?: string;
  /** Default `'Log out'`. */
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
  /** Compact age badge. Default: `relativeTime` (`now`, `34m`, `5h`, `3d`). */
  formatAge?: (at: number) => string;
  labels?: AgentChatHistoryLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AgentChatComposer
// ---------------------------------------------------------------------------

export interface AgentChatComposerLabels {
  /** Default `'Message'` (the field's accessible name). */
  field?: string;
  /** Default `'Ask me anything'`. */
  placeholder?: string;
  /** Default `'Add attachment'`. */
  attach?: string;
  /** Default `'Send message'`. */
  send?: string;
  /** Default `'Stop generating'`. */
  stop?: string;
  /** Default `'Not configured'` (status row, no provider). */
  notConfigured?: string;
  /** Default `'New chat'` (status row, no messages). */
  newChat?: string;
  /** Default `(count) => \`${count} messages\``. */
  messageCount?: (count: number) => string;
  /** Default `(model) => \`Answering with ${model}\``. */
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
  /** Header title fallback. Default `'New chat'`. */
  newChat?: string;
  /** Empty-state heading. Default `'What can I help with?'`. */
  emptyTitle?: string;
  /** Empty-state line. Default "This chat runs against your own API key…". */
  emptyDescription?: string;
  /** Status label beside the thinking dots. Default `'Thinking'`. */
  thinking?: string;
  /** Default `'Something went wrong. Check the server logs, then try again.'`. */
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

  /** Suggestion pills in the empty state. Default three. `[]` hides them. */
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
