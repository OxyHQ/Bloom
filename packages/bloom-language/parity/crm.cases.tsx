import { Button } from '@oxy.so/bloom/button';
import { ContactProfileCard } from '@oxy.so/bloom/contact-card';
import { LeadScoreCard } from '@oxy.so/bloom/lead-score';
import {
  DealCard,
  PipelineBoard,
  PipelineColumn,
  type PipelineStage,
} from '@oxy.so/bloom/pipeline';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const CONTACT = {
  role: 'Head of Operations',
  company: 'Larkspur Freight',
  status: { label: 'Customer', tone: 'success' as const },
  channels: [
    { kind: 'email' as const, onPress: press },
    { kind: 'phone' as const, onPress: press },
  ],
  owner: { name: 'Marta Oyeleye' },
  headline: { label: 'Open pipeline', value: '€248,000', delta: '+2 deals' },
  stats: [
    { value: '4', label: 'Open deals' },
    { value: '€62k', label: 'Avg deal' },
  ],
  tags: ['Enterprise', 'Logistics'],
  lastTouch: 'Last contacted 6 days ago',
  facts: ['Lisbon', 'Customer since 2024'],
};
const COMPANY = {
  kind: 'company' as const,
  role: 'Medical devices',
  coverTone: 'info' as const,
  people: [{ name: 'Ana Lima' }, { name: 'Idris Kalu' }],
  peopleLabel: 'People',
  peopleTotal: 5,
};
const FACTORS = [
  { label: 'Fits the ideal profile', contribution: 24, detail: 'Logistics, 200–500 people' },
  { label: 'No decision-maker', contribution: -9, detail: 'One contact, no budget owner' },
];
const DEAL = {
  account: 'Larkspur Freight',
  amount: '€148,000',
  closeDate: 'Closes 30 Sep',
  owner: { name: 'Marta Oyeleye' },
  health: 'stalled' as const,
  stalledFor: '23 days',
  onMove: press,
};
const STAGES: PipelineStage[] = [
  { id: 'qualified', name: 'Qualified', count: 1, total: '€148,000', tone: 'info' },
  {
    id: 'won',
    name: 'Closed won',
    count: 0,
    total: '€0',
    tone: 'success',
    emptyLabel: 'Nothing yet',
  },
];

export const CRM_CASES: ParityCase[] = [
  ...(['default', 'compact'] as const).map((density) => ({
    name: `ContactProfileCard ${density}`,
    language: () =>
      toElement(L.ContactProfileCard('Nora Vance', CONTACT).density(density).onPress(press)),
    bloom: () => (
      <ContactProfileCard
        name="Nora Vance"
        {...CONTACT}
        density={density === 'compact' ? 'compact' : 'comfortable'}
        onPress={press}
      />
    ),
  })),
  {
    name: 'ContactProfileCard a company, with actions',
    language: () =>
      toElement(
        L.ContactProfileCard('Quillon Health', {
          ...COMPANY,
          actions: L.Button(L.Text('Open')).onPress(press),
        }),
      ),
    bloom: () => (
      <ContactProfileCard
        name="Quillon Health"
        {...COMPANY}
        actions={<Button onPress={press}>Open</Button>}
      />
    ),
  },
  {
    name: 'LeadScoreCard',
    language: () =>
      toElement(
        L.LeadScoreCard(82, {
          valueText: '82 of 100, hot',
          factors: FACTORS,
          trend: { label: '+8 against last week', direction: 'up' },
        }).label('Lead score for Larkspur Freight'),
      ),
    bloom: () => (
      <LeadScoreCard
        score={82}
        accessibilityLabel="Lead score for Larkspur Freight"
        valueText="82 of 100, hot"
        factors={FACTORS}
        trend={{ label: '+8 against last week', direction: 'up' }}
      />
    ),
  },
  {
    name: 'LeadScoreCard cold, no factors',
    language: () => toElement(L.LeadScoreCard(18, { band: 'cold' }).label('Lead score')),
    bloom: () => <LeadScoreCard score={18} band="cold" accessibilityLabel="Lead score" />,
  },
  {
    name: 'DealCard',
    language: () =>
      toElement(
        L.DealCard('Fleet telematics rollout', {
          ...DEAL,
          actions: L.Text('Edit'),
        }).onPress(press),
      ),
    bloom: () => (
      <DealCard
        title="Fleet telematics rollout"
        {...DEAL}
        actions={<Text>Edit</Text>}
        onPress={press}
      />
    ),
  },
  {
    name: 'PipelineColumn',
    language: () =>
      toElement(
        L.PipelineColumn('Qualified', L.DealCard('Fleet telematics rollout', DEAL), {
          count: 1,
          total: '€148,000',
          tone: 'info',
          width: '280',
        }),
      ),
    bloom: () => (
      <PipelineColumn name="Qualified" count={1} total="€148,000" tone="info" width={280}>
        <DealCard title="Fleet telematics rollout" {...DEAL} />
      </PipelineColumn>
    ),
  },
  ...ENUMS.pipelineLayout.map((layout) => ({
    name: `PipelineBoard ${layout}`,
    language: () =>
      toElement(
        L.PipelineBoard(
          STAGES,
          (stage) =>
            stage.id === 'qualified' ? L.DealCard('Fleet telematics rollout', DEAL) : L.Text('—'),
          { columnWidth: '256' },
        ).style(layout),
      ),
    bloom: () => (
      <PipelineBoard
        stages={STAGES}
        renderStage={(stage) =>
          stage.id === 'qualified' ? (
            <DealCard title="Fleet telematics rollout" {...DEAL} />
          ) : (
            <Text>—</Text>
          )
        }
        columnWidth={256}
        layout={layout}
      />
    ),
  })),
];
