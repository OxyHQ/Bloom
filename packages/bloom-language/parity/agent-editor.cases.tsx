import { AgentCreator, AgentCreatorField, AgentCreatorSection } from '@oxy.so/bloom/agent-creator';
import type { AgentCreatorAgent } from '@oxy.so/bloom/agent-creator';
import { AgentProfile, AgentReplyIdentity } from '@oxy.so/bloom/agent-reply';
import { AiProfileCard } from '@oxy.so/bloom/ai-profile-card';
import type { ContributionCell } from '@oxy.so/bloom/chart-cards';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const change = () => {};
const AGENT: AgentCreatorAgent = {
  id: 'design',
  name: 'landing page designer',
  label: 'Design',
  description: 'Thoughtful layouts and clear hierarchy.',
  avatar: { shape: 'slender', eyes: 'oval', eyewear: 'none', accessory: 'none' },
  color: 'mint',
};
const WRITER = {
  id: 'content',
  name: 'content reviewer',
  label: 'Writing',
  avatar: { preset: 'blue_beret' } as const,
};
const BERET = { preset: 'blue_beret' } as const;
const STATS = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '12h 54m', label: 'Longest task' },
];
const PERIODS = [
  { id: 'year', label: 'Year' },
  { id: 'month', label: 'Month' },
];
/** A fixed heatmap: each cell's count and tier from its index. */
const CELLS: ContributionCell[] = Array.from({ length: 12 * 7 }, (_, index) => ({
  count: (index * 7) % 30,
  tier: ((index * 7) % 6) as ContributionCell['tier'],
  date: `Jan ${(index % 28) + 1}`,
}));
/** The card at rest: no count-up, no pop-in. */
const still = { countUpDuration: 0, animateIn: false } as const;

const creator: ParityCase[] = [
  {
    name: 'AgentCreatorField',
    language: () => toElement(L.AgentCreatorField('Name', L.Text('Design'))),
    bloom: () => (
      <AgentCreatorField label="Name">
        <Text>Design</Text>
      </AgentCreatorField>
    ),
  },
  {
    name: 'AgentCreatorField multiline, no divider',
    language: () =>
      toElement(L.AgentCreatorField('Description', L.Text('Layouts')).multiline().divider(false)),
    bloom: () => (
      <AgentCreatorField label="Description" multiline divider={false}>
        <Text>Layouts</Text>
      </AgentCreatorField>
    ),
  },
  {
    name: 'AgentCreatorSection of two rows',
    language: () =>
      toElement(
        L.AgentCreatorSection('Memory', [
          L.AgentCreatorField('Recall', L.Text('On')).divider(false).id('recall'),
          L.AgentCreatorField('Notes', L.Text('Three')).id('notes'),
        ]),
      ),
    bloom: () => (
      <AgentCreatorSection title="Memory">
        <AgentCreatorField label="Recall" divider={false}>
          <Text>On</Text>
        </AgentCreatorField>
        <AgentCreatorField label="Notes">
          <Text>Three</Text>
        </AgentCreatorField>
      </AgentCreatorSection>
    ),
  },
];

const reply: ParityCase[] = [
  {
    name: 'AgentProfile',
    language: () => toElement(L.AgentProfile([WRITER]).onPress(press)),
    bloom: () => <AgentProfile agents={[WRITER]} onPress={press} />,
  },
  {
    name: 'AgentProfile two agents, labelled, named, expanded',
    language: () =>
      toElement(
        L.AgentProfile([WRITER, { ...WRITER, id: 'b', name: 'Ana' }], {
          label: 'Team',
          expanded: true,
        })
          .onPress(press)
          .label('Open the team'),
      ),
    bloom: () => (
      <AgentProfile
        agents={[WRITER, { ...WRITER, id: 'b', name: 'Ana' }]}
        label="Team"
        expanded
        accessibilityLabel="Open the team"
        onPress={press}
      />
    ),
  },
  {
    name: 'AgentReplyIdentity',
    language: () => toElement(L.AgentReplyIdentity(BERET, 'Ana')),
    bloom: () => <AgentReplyIdentity character={BERET} name="Ana" />,
  },
  {
    name: 'AgentReplyIdentity pressable, its press named',
    language: () => toElement(L.AgentReplyIdentity(BERET, 'Ana').onPress(press).label('Open Ana')),
    bloom: () => (
      <AgentReplyIdentity character={BERET} name="Ana" onPress={press} pressLabel="Open Ana" />
    ),
  },
];

const profile: ParityCase[] = [
  {
    name: 'AiProfileCard',
    language: () => toElement(L.AiProfileCard('Maya Collins', { ...still })),
    bloom: () => <AiProfileCard name="Maya Collins" {...still} />,
  },
  {
    name: 'AiProfileCard full, actions, tinted',
    language: () =>
      toElement(
        L.AiProfileCard('Maya Collins', {
          ...still,
          handle: '@maya',
          badge: 'PRO',
          initials: 'MC',
          contributions: 7462,
          delta: '+14.8%',
          stats: STATS,
          periods: PERIODS,
          period: 'year',
          onPeriodChange: change,
          cells: CELLS,
          columns: 12,
          actions: L.Text('Follow'),
        }).tint('success'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <AiProfileCard
            name="Maya Collins"
            {...still}
            handle="@maya"
            badge="PRO"
            initials="MC"
            contributions={7462}
            delta="+14.8%"
            stats={STATS}
            periods={PERIODS}
            period="year"
            onPeriodChange={change}
            cells={CELLS}
            columns={12}
            actions={<Text>Follow</Text>}
            color={c.success}
          />
        )}
      </Themed>
    ),
  },
];

export const AGENT_EDITOR_CASES: ParityCase[] = [...creator, ...reply, ...profile];

/**
 * The editor's emotion ring turns on every frame (a frame callback on the JS
 * thread on the web): Jest compares it as it mounts; two side by side in Chrome
 * are read at different angles.
 */
export const AGENT_EDITOR_CASES_MOVING: ParityCase[] = [
  {
    name: 'AgentCreator',
    language: () => toElement(L.AgentCreator([AGENT, change], { onClose: press })),
    bloom: () => <AgentCreator agent={AGENT} onChange={change} onClose={press} />,
  },
  {
    name: 'AgentCreator its own rows and sections, no preferences',
    language: () =>
      toElement(
        L.AgentCreator([AGENT, change], {
          showPreferences: false,
          children: L.AgentCreatorField('Model', L.Text('Fast')),
          sections: L.AgentCreatorSection('Memory', L.AgentCreatorField('Recall', L.Text('On'))),
        }),
      ),
    bloom: () => (
      <AgentCreator
        agent={AGENT}
        onChange={change}
        showPreferences={false}
        sections={
          <AgentCreatorSection title="Memory">
            <AgentCreatorField label="Recall">
              <Text>On</Text>
            </AgentCreatorField>
          </AgentCreatorSection>
        }
      >
        <AgentCreatorField label="Model">
          <Text>Fast</Text>
        </AgentCreatorField>
      </AgentCreator>
    ),
  },
];
