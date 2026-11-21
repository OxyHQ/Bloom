import { AgentLimitsCard } from '@oxy.so/bloom/agent-limits-card';
import {
  AgentLogRow,
  AgentLogShimmerText,
  AgentLogToolCall,
  AgentLogToolCalls,
  AgentLogWorkingRow,
} from '@oxy.so/bloom/agent-log';
import { AgentProgress, AgentProgressLoadingText } from '@oxy.so/bloom/agent-progress';
import { AgentThinking } from '@oxy.so/bloom/agent-thinking';
import { ComposerLoader } from '@oxy.so/bloom/composer-loader';
import { ConversationSidebar } from '@oxy.so/bloom/conversation-sidebar';
import { Questionnaire } from '@oxy.so/bloom/questionnaire';
import { Text } from '@oxy.so/bloom/typography';
import { UsageCard } from '@oxy.so/bloom/usage-card';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const CONTEXT = {
  max: 200_000,
  segments: [
    { label: 'System', tokens: 12_000 },
    { label: 'Messages', tokens: 64_000 },
  ],
};
const LIMITS = [{ label: 'Weekly', used: 0.42, resets: 'Mon' }];
const USAGE = {
  max: 100,
  segments: [
    { label: 'Chat', value: 30 },
    { label: 'Images', value: 12 },
  ],
};
const QUESTIONS = [
  {
    id: 'q1',
    question: 'Where to?',
    options: [
      { value: 'sea', label: 'The sea' },
      { value: 'hills', label: 'The hills' },
    ],
  },
  {
    id: 'q2',
    question: 'With whom?',
    select: 'multiple' as const,
    options: [
      { value: 'family', label: 'Family' },
      { value: 'friends', label: 'Friends' },
    ],
  },
];
const CONVERSATIONS = [
  {
    id: 'c1',
    title: 'Trip plan',
    agents: [{ id: 'a', name: 'Ana', avatar: { preset: 'blue_beret' as const } }],
  },
  { id: 'c2', title: 'Budget', description: 'Q3', agents: [], pinned: true },
];

export const AGENT_CASES: ParityCase[] = [
  {
    name: 'AgentLimitsCard',
    language: () =>
      toElement(
        L.AgentLimitsCard({ context: CONTEXT, plan: 'Pro', limits: LIMITS, onPlanPress: press }),
      ),
    bloom: () => (
      <AgentLimitsCard context={CONTEXT} plan="Pro" limits={LIMITS} onPlanPress={press} />
    ),
  },
  {
    name: 'AgentLimitsCard expanded',
    language: () => toElement(L.AgentLimitsCard({ context: CONTEXT, expanded: true })),
    bloom: () => <AgentLimitsCard context={CONTEXT} expanded />,
  },
  {
    name: 'UsageCard',
    language: () =>
      toElement(L.UsageCard({ title: 'Usage', usage: USAGE, plan: 'Free', limits: LIMITS })),
    bloom: () => <UsageCard title="Usage" usage={USAGE} plan="Free" limits={LIMITS} />,
  },
  {
    name: 'UsageCard with a fallback and a footer',
    language: () =>
      toElement(L.UsageCard({ fallback: L.Text('No usage yet'), footer: L.Text('Footer') })),
    bloom: () => <UsageCard fallback={<Text>No usage yet</Text>} footer={<Text>Footer</Text>} />,
  },
  {
    name: 'AgentThinking open, with its reasoning and timer',
    language: () =>
      toElement(
        L.AgentThinking(L.Text('First, the route.'), {
          label: 'Thought for 4s',
          open: true,
          showTimer: true,
          durationMs: 4000,
          thinking: false,
        }),
      ),
    bloom: () => (
      <AgentThinking label="Thought for 4s" open showTimer durationMs={4000} thinking={false}>
        <Text>First, the route.</Text>
      </AgentThinking>
    ),
  },
  {
    name: 'AgentProgress',
    language: () => toElement(L.AgentProgress({ steps: ['Reading', 'Planning'], paused: true })),
    bloom: () => <AgentProgress steps={['Reading', 'Planning']} paused />,
  },
  {
    name: 'AgentProgress minimized, a step done',
    language: () =>
      toElement(
        L.AgentProgress({
          steps: ['Reading', 'Planning'],
          completedCount: 1,
          minimized: true,
          paused: true,
        }),
      ),
    bloom: () => (
      <AgentProgress steps={['Reading', 'Planning']} completedCount={1} minimized paused />
    ),
  },
  {
    name: 'AgentProgressLoadingText',
    language: () => toElement(L.AgentProgressLoadingText('Searching flights')),
    bloom: () => <AgentProgressLoadingText>Searching flights</AgentProgressLoadingText>,
  },
  {
    name: 'AgentProgressLoadingText a variant, one line',
    language: () =>
      toElement(
        L.AgentProgressLoadingText('Searching flights', { variant: 'caption-1-medium' }).lines(1),
      ),
    bloom: () => (
      <AgentProgressLoadingText variant="caption-1-medium" numberOfLines={1}>
        Searching flights
      </AgentProgressLoadingText>
    ),
  },
  {
    name: 'AgentLogRow',
    language: () =>
      toElement(L.AgentLogRow(L.Text('Read the brief'), { first: true, last: false })),
    bloom: () => (
      <AgentLogRow first last={false}>
        <Text>Read the brief</Text>
      </AgentLogRow>
    ),
  },
  {
    name: 'AgentLogShimmerText',
    language: () => toElement(L.AgentLogShimmerText('Working')),
    bloom: () => <AgentLogShimmerText>Working</AgentLogShimmerText>,
  },
  ...(['running', 'done', 'error'] as const).map((status) => ({
    name: `AgentLogToolCall ${status}`,
    language: () =>
      toElement(
        L.AgentLogToolCall('web_search', status, {
          label: 'Searched the web',
          detail: 'flights to Lisbon',
          error: status === 'error' ? 'Timed out' : undefined,
          durationMs: 1200,
        }),
      ),
    bloom: () => (
      <AgentLogToolCall
        name="web_search"
        status={status}
        label="Searched the web"
        detail="flights to Lisbon"
        error={status === 'error' ? 'Timed out' : undefined}
        durationMs={1200}
      />
    ),
  })),
  {
    name: 'AgentLogToolCalls, one expanded with its content',
    language: () =>
      toElement(
        L.AgentLogToolCalls([
          L.AgentLogToolCall('read', 'done', { expanded: true, content: L.Text('3 files') }).id(
            'a',
          ),
          L.AgentLogToolCall('write', 'running').id('b'),
        ]),
      ),
    bloom: () => (
      <AgentLogToolCalls>
        <AgentLogToolCall name="read" status="done" expanded>
          <Text>3 files</Text>
        </AgentLogToolCall>
        <AgentLogToolCall name="write" status="running" />
      </AgentLogToolCalls>
    ),
  },
  {
    name: 'ComposerLoader',
    language: () =>
      toElement(L.ComposerLoader(L.Text('Composer'), { phase: 'streaming', paused: true })),
    bloom: () => (
      <ComposerLoader phase="streaming" paused>
        <Text>Composer</Text>
      </ComposerLoader>
    ),
  },
  {
    name: 'ComposerLoader a radius and line',
    language: () =>
      toElement(L.ComposerLoader(L.Text('Composer'), { active: false, radius: '28', line: '3' })),
    bloom: () => (
      <ComposerLoader active={false} radius={28} line={3}>
        <Text>Composer</Text>
      </ComposerLoader>
    ),
  },
  {
    name: 'ConversationSidebar',
    language: () =>
      toElement(
        L.ConversationSidebar(CONVERSATIONS, { activeId: 'c1', onSelect: press, onCreate: press }),
      ),
    bloom: () => (
      <ConversationSidebar
        conversations={CONVERSATIONS}
        activeId="c1"
        onSelect={press}
        onCreate={press}
      />
    ),
  },
  {
    name: 'Questionnaire',
    language: () => toElement(L.Questionnaire(QUESTIONS, { onComplete: press })),
    bloom: () => <Questionnaire questions={QUESTIONS} onComplete={press} />,
  },
  {
    name: 'Questionnaire the second step, no footer',
    language: () => toElement(L.Questionnaire(QUESTIONS, { step: 1, footer: false })),
    bloom: () => <Questionnaire questions={QUESTIONS} step={1} footer={false} />,
  },
];

/**
 * The thinking marks, each style in each tone, and the working row's pulse:
 * they move on the JS thread for as long as the agent works, so two side by
 * side (the story's pairs) are read at different frames. Compared by the Jest
 * suites, as they mount, and left out of the story.
 */
export const AGENT_CASES_MOVING: ParityCase[] = [
  {
    name: 'AgentLogWorkingRow',
    language: () => toElement(L.AgentLogWorkingRow('Working', { reduce: true })),
    bloom: () => <AgentLogWorkingRow label="Working" reduce />,
  },
  ...ENUMS.agentThinkingStyle.flatMap((variant) =>
    ENUMS.agentThinkingTone.map((tone) => ({
      name: `AgentThinking ${variant} ${tone}`,
      language: () =>
        toElement(L.AgentThinking(undefined, { thinking: true }).style(variant).tint(tone)),
      bloom: () => <AgentThinking thinking variant={variant} tone={tone} />,
    })),
  ),
];
