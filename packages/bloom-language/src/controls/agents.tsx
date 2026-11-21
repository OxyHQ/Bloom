import {
  AgentLimitsCard as BloomAgentLimitsCard,
  type AgentLimitsCardProps,
} from '@oxy.so/bloom/agent-limits-card';
import {
  AgentLogRow as BloomAgentLogRow,
  type AgentLogRowProps,
  AgentLogShimmerText as BloomAgentLogShimmerText,
  AgentLogToolCall as BloomAgentLogToolCall,
  type AgentLogToolCallProps,
  AgentLogToolCalls as BloomAgentLogToolCalls,
  type AgentLogToolCallsProps,
  type AgentLogToolCallStatus,
  AgentLogWorkingRow as BloomAgentLogWorkingRow,
  type AgentLogWorkingRowProps,
} from '@oxy.so/bloom/agent-log';
import {
  AgentProgress as BloomAgentProgress,
  AgentProgressLoadingText as BloomAgentProgressLoadingText,
  type AgentProgressLoadingTextProps,
  type AgentProgressProps,
} from '@oxy.so/bloom/agent-progress';
import {
  AgentThinking as BloomAgentThinking,
  type AgentThinkingProps,
} from '@oxy.so/bloom/agent-thinking';
import {
  ComposerLoader as BloomComposerLoader,
  type ComposerLoaderProps,
} from '@oxy.so/bloom/composer-loader';
import {
  ConversationSidebar as BloomConversationSidebar,
  type ConversationSidebarItem,
  type ConversationSidebarProps,
} from '@oxy.so/bloom/conversation-sidebar';
import {
  Questionnaire as BloomQuestionnaire,
  type QuestionnaireProps,
  type QuestionnaireQuestion,
} from '@oxy.so/bloom/questionnaire';
import { UsageCard as BloomUsageCard, type UsageCardProps } from '@oxy.so/bloom/usage-card';

import { type Child, Node, type ViewModifiers } from '../node';
import type { AgentThinkingStyle, AgentThinkingTone, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** The agent families apps share: limits and usage, thinking, progress, the log, the loader, the sidebar, the questionnaire. */
export type AgentKind =
  | 'agentLimitsCard'
  | 'usageCard'
  | 'agentThinking'
  | 'agentProgress'
  | 'agentProgressLoadingText'
  | 'agentLogRow'
  | 'agentLogShimmerText'
  | 'agentLogToolCall'
  | 'agentLogToolCalls'
  | 'agentLogWorkingRow'
  | 'composerLoader'
  | 'conversationSidebar'
  | 'questionnaire';

type Drawn = 'style' | 'testID';

export type AgentLimitsCardOptions = Omit<AgentLimitsCardProps, Drawn>;
export type UsageCardOptions = Omit<UsageCardProps, Drawn | 'fallback' | 'footer'> & {
  readonly fallback?: Child;
  readonly footer?: Child;
};
export type AgentThinkingOptions = Omit<
  AgentThinkingProps,
  Drawn | 'children' | 'variant' | 'tone'
>;
export type AgentProgressOptions = Omit<AgentProgressProps, Drawn>;
/** Bloom `AgentProgressLoadingText`'s step of Bloom's type ramp (`body-regular` by default). */
export type AgentProgressLoadingTextOptions = Pick<AgentProgressLoadingTextProps, 'variant'>;
export type AgentLogRowOptions = Omit<AgentLogRowProps, Drawn | 'children'>;
/** Bloom `AgentLogToolCall`'s data; `content` is what it shows expanded (Bloom's children). */
export type AgentLogToolCallOptions = Omit<
  AgentLogToolCallProps,
  'testID' | 'name' | 'status' | 'children'
> & { readonly content?: Child };
export type AgentLogToolCallsOptions = Omit<
  AgentLogToolCallsProps,
  'testID' | 'children' | 'accessibilityLabel'
>;
export type AgentLogWorkingRowOptions = Omit<AgentLogWorkingRowProps, Drawn | 'label'>;
/** Bloom `ComposerLoader`'s motion and phase; its lengths are space tokens. */
export type ComposerLoaderOptions = Omit<
  ComposerLoaderProps,
  Drawn | 'children' | 'colors' | 'radius' | 'line' | 'offset'
> & { readonly radius?: SpaceToken; readonly line?: SpaceToken; readonly offset?: SpaceToken };
export type ConversationSidebarOptions = Omit<
  ConversationSidebarProps,
  Drawn | 'conversations' | 'after'
> & { readonly after?: Child };
export type QuestionnaireOptions = Omit<QuestionnaireProps, Drawn | 'questions'>;

/** Bloom `AgentLimitsCard`: the context window and the plan's usage limits. */
export type AgentLimitsCardView = ViewModifiers<AgentLimitsCardView>;
/** Bloom `UsageCard`: an account's usage and its plan's limits. */
export type UsageCardView = ViewModifiers<UsageCardView>;
/** Bloom `AgentThinking`: the agent thinking, its reasoning folded under it. */
export interface AgentThinkingView extends ViewModifiers<AgentThinkingView> {
  /** Its mark: `wave` (default), `spin`, `stars` or `infinity`. */
  style(value: AgentThinkingStyle): AgentThinkingView;
  /** `subtle`, `default`, `primary` or `accent`. */
  tint(value: AgentThinkingTone): AgentThinkingView;
}
/** Bloom `AgentProgress`: the steps an agent works through. */
export type AgentProgressView = ViewModifiers<AgentProgressView>;
/** Bloom `AgentProgressLoadingText`: a line of text that shimmers while it loads. */
export interface AgentProgressLoadingTextView extends ViewModifiers<AgentProgressLoadingTextView> {
  /** At most this many lines. */
  lines(value: number): AgentProgressLoadingTextView;
}
/** Bloom `AgentLogRow`: a row of an agent's log, on its timeline. */
export type AgentLogRowView = ViewModifiers<AgentLogRowView>;
/** Bloom `AgentLogShimmerText`: a log line that shimmers while it runs. */
export type AgentLogShimmerTextView = ViewModifiers<AgentLogShimmerTextView>;
/** Bloom `AgentLogToolCall`: one tool call, its status and what it returned. */
export type AgentLogToolCallView = ViewModifiers<AgentLogToolCallView>;
/** Bloom `AgentLogToolCalls`: a turn's tool calls. */
export type AgentLogToolCallsView = ViewModifiers<AgentLogToolCallsView>;
/** Bloom `AgentLogWorkingRow`: the row that says the agent is working. */
export type AgentLogWorkingRowView = ViewModifiers<AgentLogWorkingRowView>;
/** Bloom `ComposerLoader`: the light that runs round a composer as an agent works. */
export type ComposerLoaderView = ViewModifiers<ComposerLoaderView>;
/** Bloom `ConversationSidebar`: an agent app's conversations. */
export type ConversationSidebarView = ViewModifiers<ConversationSidebarView>;
/** Bloom `Questionnaire`: questions asked one at a time. */
export type QuestionnaireView = ViewModifiers<QuestionnaireView>;

export function AgentLimitsCard(options: AgentLimitsCardOptions = {}): AgentLimitsCardView {
  return new Node('agentLimitsCard', { options }, []);
}
export function UsageCard(options: UsageCardOptions = {}): UsageCardView {
  return new Node('usageCard', { options }, []);
}
/** Bloom `AgentThinking`, its reasoning (`reasoning`) shown when it is opened. */
export function AgentThinking(
  reasoning?: Child,
  options: AgentThinkingOptions = {},
): AgentThinkingView {
  return new Node('agentThinking', { options }, reasoning === undefined ? [] : [reasoning]);
}
export function AgentProgress(options: AgentProgressOptions = {}): AgentProgressView {
  return new Node('agentProgress', { options }, []);
}
export function AgentProgressLoadingText(
  text: string,
  options: AgentProgressLoadingTextOptions = {},
): AgentProgressLoadingTextView {
  return new Node('agentProgressLoadingText', { text, options }, []);
}
/** Bloom `AgentLogRow` around `content`; `first` and `last` place it on the timeline. */
export function AgentLogRow(content: Child, options: AgentLogRowOptions): AgentLogRowView {
  return new Node('agentLogRow', { options }, [content]);
}
export function AgentLogShimmerText(text: string): AgentLogShimmerTextView {
  return new Node('agentLogShimmerText', { text }, []);
}
/** Bloom `AgentLogToolCall`: the tool's name and `running`, `done` or `error`. */
export function AgentLogToolCall(
  name: string,
  status: AgentLogToolCallStatus,
  options: AgentLogToolCallOptions = {},
): AgentLogToolCallView {
  return new Node('agentLogToolCall', { name, status, options }, []);
}
/** Bloom `AgentLogToolCalls` of these calls (a list, keyed by `.id()`). */
export function AgentLogToolCalls(
  calls: Child,
  options: AgentLogToolCallsOptions = {},
): AgentLogToolCallsView {
  return new Node('agentLogToolCalls', { options }, [calls]);
}
export function AgentLogWorkingRow(
  label: string,
  options: AgentLogWorkingRowOptions = {},
): AgentLogWorkingRowView {
  return new Node('agentLogWorkingRow', { label, options }, []);
}
/** Bloom `ComposerLoader` round `content` (the composer). */
export function ComposerLoader(
  content: Child,
  options: ComposerLoaderOptions = {},
): ComposerLoaderView {
  return new Node('composerLoader', { options }, [content]);
}
export function ConversationSidebar(
  conversations: readonly ConversationSidebarItem[],
  options: ConversationSidebarOptions,
): ConversationSidebarView {
  return new Node('conversationSidebar', { conversations, options }, []);
}
export function Questionnaire(
  questions: readonly QuestionnaireQuestion[],
  options: QuestionnaireOptions = {},
): QuestionnaireView {
  return new Node('questionnaire', { questions, options }, []);
}

/** A component whose text is its only child (Bloom takes it as `children`). */
function text(host: unknown, own: (d: ControlDraw) => Record<string, unknown> = () => ({})) {
  return (d: ControlDraw) => {
    const { text: content, options } = d.node.props as { text: string; options?: object };
    return d.pressAround((props) =>
      d.component(host, { ...props, ...options, ...own(d) }, content),
    );
  };
}

export const AGENTS: Record<AgentKind, ControlRenderer> = {
  agentLimitsCard: product(BloomAgentLimitsCard),
  usageCard: product(BloomUsageCard, { slots: ['fallback', 'footer'] }),
  agentThinking: product(BloomAgentThinking, {
    own: (d) => ({ variant: d.own('style')?.value, tone: d.own('tint')?.value }),
  }),
  agentProgress: product(BloomAgentProgress),
  agentProgressLoadingText: text(BloomAgentProgressLoadingText, (d) => ({
    numberOfLines: d.own('lines')?.value,
  })),
  agentLogRow: product(BloomAgentLogRow),
  agentLogShimmerText: text(BloomAgentLogShimmerText),
  agentLogToolCall: (d) => {
    const { name, status, options } = d.node.props as {
      name: string;
      status: AgentLogToolCallStatus;
      options: AgentLogToolCallOptions;
    };
    const { content, ...rest } = options;
    return d.component(
      BloomAgentLogToolCall,
      { ...d.props(), ...rest, name, status },
      ...(content === undefined ? [] : [d.render(content)]),
    );
  },
  agentLogToolCalls: product(BloomAgentLogToolCalls),
  agentLogWorkingRow: product(BloomAgentLogWorkingRow),
  composerLoader: product(BloomComposerLoader, { lengths: ['radius', 'line', 'offset'] }),
  conversationSidebar: product(BloomConversationSidebar, { slots: ['after'] }),
  questionnaire: product(BloomQuestionnaire),
};
