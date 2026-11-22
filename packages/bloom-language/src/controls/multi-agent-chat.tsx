import { MultiAgentChat as BloomMultiAgentChat } from '@oxy.so/bloom/multi-agent-chat';
import type { MultiAgentChatAgent, MultiAgentChatProps } from '@oxy.so/bloom/multi-agent-chat';
import { SelectedAgentPreview as BloomSelectedAgentPreview } from '@oxy.so/bloom/multi-agent-chat/selected-agent-preview';
import type { AvatarFlights } from '@oxy.so/bloom/avatar-flight';

import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The multi-agent chat: a workspace of agents, and the preview of a chosen team. */
export type MultiAgentChatKind = 'selectedAgentPreview' | 'multiAgentChat';

/**
 * Bloom `SelectedAgentPreview`'s flights (`useAvatarFlights()`, so a chosen
 * avatar flies in and out), the name its avatars fly by, and whether it
 * shows its caption.
 */
export interface SelectedAgentPreviewOptions {
  readonly flights: AvatarFlights;
  readonly anchor: string;
  readonly caption?: boolean;
}
/** Bloom `MultiAgentChat`'s data, storage and handlers, as Bloom takes them. */
export type MultiAgentChatOptions = Omit<MultiAgentChatProps, 'className' | 'style' | 'testID'>;

/** Bloom `SelectedAgentPreview`: one large avatar, a trio, or a ring from four up. */
export type SelectedAgentPreviewView = ViewModifiers<SelectedAgentPreviewView>;
/** Bloom `MultiAgentChat`. */
export type MultiAgentChatView = ViewModifiers<MultiAgentChatView>;

/** Bloom `SelectedAgentPreview` of the chosen `agents`. */
export function SelectedAgentPreview(
  agents: readonly MultiAgentChatAgent[],
  options: SelectedAgentPreviewOptions,
): SelectedAgentPreviewView {
  return new Node('selectedAgentPreview', { agents, options }, []);
}
/** Bloom `MultiAgentChat`. */
export function MultiAgentChat(options: MultiAgentChatOptions = {}): MultiAgentChatView {
  return new Node('multiAgentChat', { options }, []);
}

export const MULTI_AGENT_CHATS: Record<MultiAgentChatKind, ControlRenderer> = {
  selectedAgentPreview: product(BloomSelectedAgentPreview),
  multiAgentChat: product(BloomMultiAgentChat),
};
