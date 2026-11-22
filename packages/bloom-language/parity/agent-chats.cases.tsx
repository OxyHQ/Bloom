import type { ReactNode } from 'react';
import { AgentChat, AgentChatHistory } from '@oxy.so/bloom/agent-chat';
import type { AgentChatMessageData, AgentChatThread } from '@oxy.so/bloom/agent-chat';
import { type AvatarFlights, useAvatarFlights } from '@oxy.so/bloom/avatar-flight';
import { MultiAgentChat } from '@oxy.so/bloom/multi-agent-chat';
import { SelectedAgentPreview } from '@oxy.so/bloom/multi-agent-chat/selected-agent-preview';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
/** A fixed clock, so both sides draw the same ages and times. */
const AT = Date.UTC(2026, 10, 20, 9, 30);
const age = () => '2h';
const AGENTS = (
  [
    ['design', 'mint'],
    ['content', 'orange'],
    ['growth', 'blue'],
    ['support', 'pink'],
  ] as const
).map(([id, color]) => ({
  id,
  name: `${id} agent`,
  label: id,
  description: '',
  avatar: { shape: 'slender', eyes: 'oval', eyewear: 'none', accessory: 'none' } as const,
  color,
}));
const THREADS: AgentChatThread[] = [
  { id: 't1', title: 'Landing page copy', updatedAt: AT, unread: true },
  { id: 't2', title: 'Pricing table', updatedAt: AT - 3_600_000 },
];
const MESSAGES: AgentChatMessageData[] = [
  { id: 'm1', role: 'user', text: 'Draft a headline', at: AT },
  { id: 'm2', role: 'assistant', text: 'Ship faster with Bloom.', at: AT, markdown: false },
];

/** Avatar flights as an app holds them (`useAvatarFlights()`), handed to both sides. */
function Flights({ children }: { children: (flights: AvatarFlights) => ReactNode }): ReactNode {
  return children(useAvatarFlights());
}

const previews: ParityCase[] = [0, 1, 3, 4].map((count) => ({
  name: `SelectedAgentPreview ${count} agents`,
  language: () => (
    <Flights>
      {(flights) =>
        toElement(
          L.SelectedAgentPreview(AGENTS.slice(0, count), {
            flights,
            anchor: 'picker',
            caption: count === 0,
          }),
        )
      }
    </Flights>
  ),
  bloom: () => (
    <Flights>
      {(flights) => (
        <SelectedAgentPreview
          agents={AGENTS.slice(0, count)}
          flights={flights}
          anchor="picker"
          caption={count === 0}
        />
      )}
    </Flights>
  ),
}));

const history: ParityCase[] = [
  {
    name: 'AgentChatHistory',
    language: () =>
      toElement(L.AgentChatHistory(THREADS, { activeId: 't1', onSelect: press, formatAge: age })),
    bloom: () => (
      <AgentChatHistory threads={THREADS} activeId="t1" onSelect={press} formatAge={age} />
    ),
  },
  {
    name: 'AgentChatHistory on a surface of its own, after, an account',
    language: () =>
      toElement(
        L.AgentChatHistory(THREADS, {
          formatAge: age,
          onNewChat: press,
          account: { name: 'Ana Lima' },
          usage: [{ label: 'Weekly', value: '42%', percent: 42 }],
          after: L.Text('Help'),
        }).surface(false),
      ),
    bloom: () => (
      <AgentChatHistory
        threads={THREADS}
        formatAge={age}
        onNewChat={press}
        account={{ name: 'Ana Lima' }}
        usage={[{ label: 'Weekly', value: '42%', percent: 42 }]}
        after={<Text>Help</Text>}
        framed={false}
      />
    ),
  },
];

const chats: ParityCase[] = [
  {
    name: 'AgentChat empty, its own empty state',
    language: () =>
      toElement(L.AgentChat([], { title: 'New chat', emptyState: L.Text('Ask anything') })),
    bloom: () => (
      <AgentChat messages={[]} title="New chat" emptyState={<Text>Ask anything</Text>} />
    ),
  },
  ...ENUMS.titleAlign.map((align) => ({
    name: `AgentChat a conversation, title ${align}, header slots`,
    language: () =>
      toElement(
        L.AgentChat(MESSAGES, {
          title: 'Headline',
          status: 'ready',
          onSubmit: press,
          headerLeading: L.Text('Back'),
          headerIdentity: L.Text('Ana'),
          messageLabels: { copy: 'Copy' },
        }).titleAlign(align),
      ),
    bloom: () => (
      <AgentChat
        messages={MESSAGES}
        title="Headline"
        status="ready"
        onSubmit={press}
        headerLeading={<Text>Back</Text>}
        headerIdentity={<Text>Ana</Text>}
        messageLabels={{ copy: 'Copy' }}
        headerTitleAlign={align}
      />
    ),
  })),
  {
    name: 'AgentChat with its history',
    language: () =>
      toElement(
        L.AgentChat(MESSAGES, {
          threads: THREADS,
          activeThreadId: 't1',
          onSelectThread: press,
          showHistory: true,
          historyProps: { formatAge: age },
        }),
      ),
    bloom: () => (
      <AgentChat
        messages={MESSAGES}
        threads={THREADS}
        activeThreadId="t1"
        onSelectThread={press}
        showHistory
        historyProps={{ formatAge: age }}
      />
    ),
  },
];

const workspaces: ParityCase[] = [
  {
    name: 'MultiAgentChat',
    language: () => toElement(L.MultiAgentChat({ storageKey: null })),
    bloom: () => <MultiAgentChat storageKey={null} />,
  },
];

export const AGENT_CHAT_CASES: ParityCase[] = [...previews, ...history, ...chats, ...workspaces];
