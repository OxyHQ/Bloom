import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { ComposerPill } from '../composer-panel';
import { Markdown } from '../markdown';
import { Questionnaire, type QuestionnaireQuestion } from '../questionnaire';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  AgentProfile,
  AgentReply,
  AgentReplyActions,
  AgentReplyBubble,
  AgentReplyIdentity,
  type AgentReplyAgent,
} from './index';

const meta: Meta = {
  title: 'Agents/Overview',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const TEAM: AgentReplyAgent[] = [
  {
    id: 'design',
    name: 'Landing page designer',
    label: 'Design',
    avatar: { shape: 'slender', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'teal' },
  },
  {
    id: 'seo',
    name: 'SEO bot',
    label: 'SEO',
    avatar: {
      shape: 'six_lobed_flower',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'none',
      color: 'violet',
    },
  },
  {
    id: 'data',
    name: 'Data analyst',
    label: 'Analytics',
    avatar: { shape: 'pocket', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'cyan' },
  },
];

const ANSWERS: Record<string, string> = {
  design:
    'Give the hero **one clear action**. Lead with the outcome, pair it with a focused product preview, and move the secondary links below the fold.',
  seo: 'Start with a practical guide to the core topic, then support it with articles that answer the *next* questions readers ask:\n\n- one guide, linked from every article\n- one related next step in each',
  data: 'Track activation next to weekly retention.\n\n| Week | Activation | Retention |\n| --- | ---: | ---: |\n| 1 | 41% | 33% |\n| 2 | 44% | 35% |\n| 3 | 47% | 38% |',
};

const QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'focus',
    question: 'Which should I tackle first?',
    select: 'single',
    options: [
      { value: 'landing', label: 'The landing page', description: 'Hero, benefits, one action' },
      { value: 'seo', label: 'Search', description: 'A guide and a topic cluster' },
      { value: 'metrics', label: 'The weekly dashboard' },
    ],
    other: true,
  },
];

/**
 * A whole conversation with a team, made only of public Bloom pieces: the profile naming the team,
 * each agent in its own bubble with its 3D avatar under it, one still thinking, and a question the
 * agent waits on docked above the composer instead of sitting in the thread.
 */
export const Conversation: StoryObj = {
  render: () => {
    const { colors } = useTheme();
    const [asking, setAsking] = useState(true);
    const [draft, setDraft] = useState('');
    return (
      <View
        style={{
          flex: 1,
          minHeight: 760,
          backgroundColor: colors.background,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 640, flex: 1, paddingVertical: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <AgentProfile agents={TEAM} onPress={() => undefined} />
          </View>
          <StyledView
            className="bg-background-primary-default"
            style={{
              alignSelf: 'flex-end',
              marginTop: 16,
              marginEnd: 12,
              maxWidth: '80%',
              borderRadius: 20,
              padding: 12,
            }}
          >
            <Text variant="body-regular">How do we make the launch land?</Text>
          </StyledView>
          {TEAM.slice(0, 2).map((agent) => (
            <AgentReply
              key={agent.id}
              identity={<AgentReplyIdentity character={agent.avatar} name={agent.name} />}
              actions={<AgentReplyActions onCopy={() => undefined} />}
            >
              <AgentReplyBubble>
                <Markdown>{ANSWERS[agent.id]!}</Markdown>
              </AgentReplyBubble>
            </AgentReply>
          ))}
          <AgentReply
            identity={
              <AgentReplyIdentity character={TEAM[2]!.avatar} name={TEAM[2]!.name} thinking />
            }
          >
            {null}
          </AgentReply>
          <View style={{ flex: 1 }} />
          <View style={{ paddingHorizontal: 12 }}>
            <ComposerPill
              value={draft}
              onValueChange={setDraft}
              onSubmit={() => setDraft('')}
              question={
                asking ? (
                  <Questionnaire
                    questions={QUESTIONS}
                    onComplete={() => setAsking(false)}
                    onDismiss={() => setAsking(false)}
                  />
                ) : undefined
              }
            />
          </View>
        </View>
      </View>
    );
  },
};
