import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import { RiSettings3Line } from '../icons/remix/RiSettings3Line';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  AgentChat,
  AgentChatActions,
  AgentChatComposer,
  AgentChatHistory,
  AgentChatMessage,
  type AgentChatHistoryProps,
  type AgentChatMessageData,
  type AgentChatStatus,
  type AgentChatThread,
} from './index';
import { useAgentChatPalette } from './shared';

const meta: Meta = {
  argTypes: {
    "status": { control: 'select', options: ["error","ready","submitted","streaming"] },
    "error": { control: 'boolean' },
    "title": { control: 'text' },
    "value": { control: 'text' },
    "model": { control: 'text' },
    "provider": { control: 'text' },
    "activeThreadId": { control: 'text' },
    "showHistory": { control: 'boolean' }
  },
  component: AgentChat,
  parameters: { controls: { disable: true } },
  title: 'Blocks/Agent Chat',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data (demo answers and account)
// ---------------------------------------------------------------------------

const NOW = Date.now();
const MIN = 60_000;

const ANSWERS: { match: RegExp; reply: string }[] = [
  {
    match: /starter|what (is|does) this|about this app/i,
    reply:
      "This is the Bloom chat starter: a Next.js app with a streaming chat, a dashboard, an inbox and sign-in screens, all built from Bloom's components and installed as source you own. Right now I'm in demo mode, so this answer is canned. Add AI_API_KEY in your Vercel project settings, redeploy, and the same chat talks to a real model.",
  },
  {
    match: /product update|announcement|release notes|changelog/i,
    reply:
      "Here's a product update in three sentences.\nThis release adds a dashboard with revenue and orders charts, an inbox, and sign-in and sign-up screens, all built from the same free components as the chat.\nEvery page installs as source, so nothing is locked behind a package. It deploys to Vercel in a click and runs on your own model key.",
  },
  {
    match: /names?\b.*\b(app|product|scheduling|startup|company)|name ideas|suggest.*names/i,
    reply:
      "Five names for a scheduling app: Slotwise, Tidemark, Cadence, Dayline, and Meridian.\nSlotwise says what it does, Cadence and Meridian carry a rhythm, Tidemark and Dayline feel like calendars without saying so.",
  },
];

const FALLBACK =
  "I'm in demo mode, so I can only answer from a short script, and that question isn't in it. Add AI_API_KEY in your Vercel project settings and redeploy, and this same chat will answer properly.";

const pickAnswer = (prompt: string) =>
  ANSWERS.find((answer) => answer.match.test(prompt))?.reply ?? FALLBACK;

const CONVERSATION: AgentChatMessageData[] = [
  { id: 'm1', role: 'user', text: 'Write a product update in three sentences', at: NOW - 4 * MIN },
  { id: 'm2', role: 'assistant', text: ANSWERS[1]!.reply, at: NOW - 4 * MIN },
  { id: 'm3', role: 'user', text: 'Give me five names for a scheduling app', at: NOW - 2 * MIN },
  { id: 'm4', role: 'assistant', text: ANSWERS[2]!.reply, at: NOW - 2 * MIN },
];

const THREADS: AgentChatThread[] = [
  { id: 't1', title: 'Write a product update in three sentences', updatedAt: NOW - 2 * MIN },
  { id: 't2', title: 'Give me five names for a scheduling app', updatedAt: NOW - 34 * MIN, unread: true },
  { id: 't3', title: 'Explain what this starter does', updatedAt: NOW - 5 * 60 * MIN },
  { id: 't4', title: 'Draft a launch tweet for the dashboard release', updatedAt: NOW - 18 * 60 * MIN },
  { id: 't5', title: 'Summarise the onboarding feedback from last week', updatedAt: NOW - 3 * 24 * 60 * MIN },
];

const ACCOUNT: Pick<
  AgentChatHistoryProps,
  'account' | 'usage' | 'onUpgrade' | 'accountItems' | 'onLogOut'
> = {
  account: { name: 'Maya Collins', initials: 'M' },
  usage: [
    { label: 'Chats', value: '5 of 30', percent: 17 },
    { label: 'Storage', value: '38 KB', percent: 1 },
  ],
  onUpgrade: () => {},
  accountItems: [
    { key: 'invite', label: 'Invite a friend', icon: RiSendPlaneLine, onPress: () => {} },
    { key: 'settings', label: 'Settings', icon: RiSettings3Line, onPress: () => {} },
  ],
  onLogOut: () => {},
};

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

/** The page frame: background-full, p 12, and a viewport-tall workspace. */
function Page({ children, height = 760, width = 1400, testID }: { children: React.ReactNode; height?: number; width?: number; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ width, maxWidth: '100%', height, padding: 12, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

function Pad({ children, width = 480, testID }: { children: React.ReactNode; width?: number; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ width, maxWidth: '100%', gap: 24, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  A story-local fake streamer (700ms think, 28ms a word)
// ---------------------------------------------------------------------------

function useDemoChat(initial: AgentChatMessageData[] = [], initialThreads: AgentChatThread[] = THREADS) {
  const [messages, setMessages] = useState<AgentChatMessageData[]>(initial);
  const [status, setStatus] = useState<AgentChatStatus>('ready');
  const [threads, setThreads] = useState<AgentChatThread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string>('live');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const stop = useCallback(() => {
    clear();
    setStatus('ready');
  }, []);

  const send = useCallback((text: string) => {
    const at = Date.now();
    const replyId = `a-${at}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${at}`, role: 'user', text, at },
      { id: replyId, role: 'assistant', text: '', at },
    ]);
    setStatus('submitted');
    setThreads((prev) =>
      prev.some((thread) => thread.id === 'live')
        ? prev.map((thread) => (thread.id === 'live' ? { ...thread, updatedAt: at } : thread))
        : [{ id: 'live', title: text.length > 48 ? `${text.slice(0, 48)}...` : text, updatedAt: at }, ...prev],
    );
    const words = pickAnswer(text).split(/(?<=\s)/);
    let elapsed = 700;
    words.forEach((word, index) => {
      timers.current.push(
        setTimeout(() => {
          setStatus('streaming');
          setMessages((prev) =>
            prev.map((message) => (message.id === replyId ? { ...message, text: message.text + word } : message)),
          );
          if (index === words.length - 1) setStatus('ready');
        }, elapsed),
      );
      elapsed += 28;
    });
  }, []);

  return {
    messages,
    status,
    threads,
    activeId,
    send,
    stop,
    newChat: () => {
      stop();
      setMessages([]);
      setActiveId('fresh');
    },
    select: (id: string) => {
      setActiveId(id);
      setThreads((prev) => prev.map((thread) => (thread.id === id ? { ...thread, unread: false } : thread)));
    },
    rename: (id: string, title: string) =>
      setThreads((prev) => prev.map((thread) => (thread.id === id ? { ...thread, title } : thread))),
    toggleUnread: (id: string) =>
      setThreads((prev) => prev.map((thread) => (thread.id === id ? { ...thread, unread: !thread.unread } : thread))),
    remove: (id: string) => setThreads((prev) => prev.filter((thread) => thread.id !== id)),
  };
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** The full workspace, streaming scripted answers: type, pick a suggestion, stop, browse history. */
export const Demo: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const chat = useDemoChat();
    return (
      <Page testID="agent-chat-demo">
        <AgentChat
          testID="chat"
          messages={chat.messages}
          status={chat.status}
          onSubmit={chat.send}
          onStop={chat.stop}
          model="anthropic/claude-sonnet-4.5"
          provider="Demo mode"
          threads={chat.threads}
          activeThreadId={chat.activeId}
          onSelectThread={chat.select}
          onNewChat={chat.newChat}
          onRenameThread={chat.rename}
          onToggleUnread={chat.toggleUnread}
          onDeleteThread={chat.remove}
          onExport={() => {}}
          showHistory
          historyProps={ACCOUNT}
          labels={{ emptyDescription: 'Demo mode: the answers are scripted. Add AI_API_KEY for a real model.' }}
        />
      </Page>
    );
  },
};

/** A settled conversation with history: hover a reply for its actions, scroll to frost the header. */
export const Conversation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page testID="agent-chat-conversation">
      <AgentChat
        testID="chat"
        messages={CONVERSATION}
        model="openai/gpt-5-nano"
        provider="OpenAI"
        threads={THREADS}
        activeThreadId="t1"
        onSelectThread={() => {}}
        onNewChat={() => {}}
        onRenameThread={() => {}}
        onToggleUnread={() => {}}
        onDeleteThread={() => {}}
        onExport={() => {}}
        showHistory
        historyProps={ACCOUNT}
      />
    </Page>
  ),
};

/** Nothing sent yet: the prompt centred in the empty card, three suggestions. */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page testID="agent-chat-empty">
      <AgentChat testID="chat" messages={[]} provider="Anthropic" model="claude-sonnet-4.5" />
    </Page>
  ),
};

/** Sent, nothing streamed yet: the wave "Thinking" indicator and the composer light band. */
export const Thinking: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page testID="agent-chat-thinking">
      <AgentChat
        testID="chat"
        status="submitted"
        messages={[{ id: 'u', role: 'user', text: 'Explain what this starter does', at: NOW }]}
        provider="Demo mode"
      />
    </Page>
  ),
};

/** Mid-reply: the last message's actions stay hidden until it settles. */
export const Streaming: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page testID="agent-chat-streaming">
      <AgentChat
        testID="chat"
        status="streaming"
        messages={[
          { id: 'u', role: 'user', text: 'Explain what this starter does', at: NOW },
          { id: 'a', role: 'assistant', text: ANSWERS[0]!.reply.slice(0, 160), at: NOW },
        ]}
        provider="Demo mode"
      />
    </Page>
  ),
};

/** The request failed. */
export const ErrorState: Story = {
  parameters: { controls: { disable: true } },
  name: 'Error',
  render: () => (
    <Page testID="agent-chat-error">
      <AgentChat
        testID="chat"
        status="error"
        messages={[{ id: 'u', role: 'user', text: 'Give me five names for a scheduling app', at: NOW }]}
        provider="OpenAI"
      />
    </Page>
  ),
};

/** `emptyState` replaces the whole card body — an "Add an API key" notice. */
export const SetupNotice: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const { colors, isDark } = useTheme();
    return (
      <Page testID="agent-chat-setup">
        <AgentChat
          testID="chat"
          messages={[]}
          emptyState={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <View
                style={{
                  maxWidth: 448,
                  gap: 12,
                  borderRadius: 16,
                  padding: 24,
                  backgroundColor: isDark ? '#262626' : colors.card,
                  boxShadow: '0 1px 1px 0 rgba(0, 0, 0, 0.05)',
                }}>
                <Text variant="headline-medium">Add an API key to start</Text>
                <Text variant="body-regular" style={{ color: '#737373' }}>
                  The chat is wired up and ready. It needs a model provider key before it can answer.
                </Text>
                <Button size="md" onPress={() => {}} appearance="solid" tone="accent">
                  Skip, show me the demo
                </Button>
              </View>
            </View>
          }
        />
      </Page>
    );
  },
};

/** The rail alone: active, unread, hover a row for its menu; the account menu opens upward. */
export const History: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const chat = useDemoChat();
    return (
      <Page height={640} width={284} testID="agent-chat-history">
        <AgentChatHistory
          testID="history"
          threads={chat.threads}
          activeId="t1"
          onSelect={chat.select}
          onNewChat={() => {}}
          onRename={chat.rename}
          onToggleUnread={chat.toggleUnread}
          onDelete={chat.remove}
          onExport={() => {}}
          {...ACCOUNT}
        />
      </Page>
    );
  },
};

/** No chats yet (export disabled) and a mid-stream rail (rows and "New chat" disabled). */
export const HistoryStates: Story = {
  parameters: { controls: { disable: true } },
  render: function HistoryStatesDemo() {
    const compact = useWindowDimensions().width < 620;
    return <Page height={compact ? 840 : 420} width={580} testID="agent-chat-history-states">
      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 16, height: '100%' }}>
        <View style={{ flex: 1, minHeight: 0 }}><AgentChatHistory threads={[]} onNewChat={() => {}} onExport={() => {}} {...ACCOUNT} /></View>
        <View style={{ flex: 1, minHeight: 0 }}><AgentChatHistory threads={THREADS.slice(0, 3)} activeId="t1" disabled onExport={() => {}} {...ACCOUNT} /></View>
      </View>
    </Page>;
  },
};

/** The composer: empty, filled, with a model, and busy (stop + light band). */
export const Composer: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [text, setText] = useState('');
    const palette = useAgentChatPalette();
    return (
      <Pad width={720} testID="agent-chat-composer">
        <View style={{ padding: 16, borderRadius: 24, gap: 24, backgroundColor: palette.chatSurface }}>
          <AgentChatComposer testID="composer" value={text} onValueChange={setText} onSubmit={() => setText('')} messageCount={0} />
          <AgentChatComposer defaultValue="Draft a launch tweet" provider="OpenAI" model="openai/gpt-5-nano" messageCount={4} />
          <AgentChatComposer busy provider="Demo mode" model="claude-sonnet-4.5" messageCount={5} />
        </View>
      </Pad>
    );
  },
};

/** Header actions, enabled and disabled (no chat open). */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Pad testID="agent-chat-actions">
      <View style={{ flexDirection: 'row', gap: 24 }}>
        <AgentChatActions
          testID="actions"
          transcript="You: Hi\n\nAssistant: Hello."
          onExport={() => {}}
          onToggleUnread={() => {}}
          onDelete={() => {}}
        />
        <AgentChatActions transcript="" disabled />
      </View>
    </Pad>
  ),
};

/** One of each turn; hover the reply for copy / read aloud / timestamp. */
export const Messages: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Pad width={640} testID="agent-chat-messages">
      <AgentChatMessage role="user" text={'Write a product update\nin three sentences'} />
      <AgentChatMessage testID="reply" role="assistant" text={ANSWERS[1]!.reply} at={NOW - 3 * MIN} />
      <AgentChatMessage role="assistant" text="Still streaming, so no actions yet…" streaming />
    </Pad>
  ),
};
