import {
  AgentChat as BloomAgentChat,
  AgentChatHistory as BloomAgentChatHistory,
  type AgentChatHistoryProps,
  type AgentChatMessageData,
  type AgentChatProps,
  type AgentChatThread,
} from '@oxy.so/bloom/agent-chat';

import type { Bound } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { TitleAlign } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The agent chat: a conversation with an agent, and its history rail. */
export type AgentChatKind = 'agentChatHistory' | 'agentChat';

/** Bloom `AgentChatHistory`'s data and handlers; `after` is a language child. */
export type AgentChatHistoryOptions = Omit<
  AgentChatHistoryProps,
  'threads' | 'after' | 'framed' | 'style' | 'testID' | 'query' | 'onQueryChange'
> & { readonly after?: Child };

type ChatSlots = 'emptyState' | 'headerLeading' | 'headerIdentity';
/**
 * Bloom `AgentChat`'s state, draft, handlers, history and words, as Bloom
 * takes them; `emptyState`, `headerLeading` and `headerIdentity` are
 * language children.
 */
export type AgentChatOptions = Omit<
  AgentChatProps,
  'messages' | 'headerTitleAlign' | 'style' | 'testID' | ChatSlots | 'value' | 'onValueChange'
> & { readonly [K in ChatSlots]?: Child };

/** Bloom `AgentChatHistory`: the threads, search and account rail. */
export interface AgentChatHistoryView extends ViewModifiers<AgentChatHistoryView> {
  query(value: Bound<AgentChatHistoryProps, 'query'>): AgentChatHistoryView;
  /** `.surface(false)`: drawn on a surface of the host's (Bloom's `framed={false}`). */
  surface(value?: boolean): AgentChatHistoryView;
}
/** Bloom `AgentChat`. */
export interface AgentChatView extends ViewModifiers<AgentChatView> {
  value(value: Bound<AgentChatProps, 'value'>): AgentChatView;
  /** The header's title: `start` or `center`. */
  titleAlign(value: TitleAlign): AgentChatView;
}

/** Bloom `AgentChatHistory` of `threads`. */
export function AgentChatHistory(
  threads: readonly AgentChatThread[],
  options: AgentChatHistoryOptions = {},
): AgentChatHistoryView {
  return new Node('agentChatHistory', { threads, options }, []);
}
/** Bloom `AgentChat` of `messages`. */
export function AgentChat(
  messages: readonly AgentChatMessageData[],
  options: AgentChatOptions = {},
): AgentChatView {
  return new Node('agentChat', { messages, options }, []);
}

export const AGENT_CHATS: Record<AgentChatKind, ControlRenderer> = {
  agentChatHistory: product(BloomAgentChatHistory, {
    bindings: { query: ['query', 'onQueryChange'] },
    slots: ['after'],
    own: (d) => ({ framed: d.own('surface')?.value }),
  }),
  agentChat: product(BloomAgentChat, {
    bindings: { value: ['value', 'onValueChange'] },
    slots: ['emptyState', 'headerLeading', 'headerIdentity'],
    own: (d) => ({ headerTitleAlign: d.own('titleAlign')?.value }),
  }),
};
