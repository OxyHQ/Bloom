import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlyphButton } from '../button';
import { RiMore2Line } from '../icons/remix';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DealCard } from './DealCard';
import { PipelineBoard } from './PipelineBoard';
import { PipelineColumn } from './PipelineColumn';
import type { DealCardProps, PipelineStage } from './types';

const meta: Meta = {
  title: 'Blocks/CRM/Pipeline',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented accounts, invented amounts, all pre-formatted.
// ---------------------------------------------------------------------------

type Deal = DealCardProps & { id: string; stageId: string };

const DEALS: Deal[] = [
  {
    id: 'd1',
    stageId: 'qualified',
    title: 'Fleet telematics rollout',
    account: 'Larkspur Freight',
    amount: '€148,000',
    closeDate: 'Closes 30 Sep',
    owner: { name: 'Marta Oyeleye' },
    health: 'on-track',
  },
  {
    id: 'd2',
    stageId: 'qualified',
    title: 'Warehouse scanner refresh',
    account: 'Meridian Tiles',
    amount: '€22,400',
    closeDate: 'Closes 12 Oct',
    owner: { name: 'Teodor Nagy' },
    health: 'at-risk',
  },
  {
    id: 'd3',
    stageId: 'proposal',
    title: 'Theatre inventory platform, three sites',
    account: 'Quillon Health',
    amount: '€1,240,000',
    closeDate: 'Closes 4 Nov',
    owner: { name: 'Marta Oyeleye' },
    health: 'stalled',
    stalledFor: '23 days',
  },
  {
    id: 'd4',
    stageId: 'proposal',
    title: 'Studio lighting retrofit',
    account: 'Sablefield Studio',
    amount: '€64,900',
    closeDate: 'Closes 18 Oct',
    owner: { name: 'Ines Coutinho' },
  },
  {
    id: 'd5',
    stageId: 'negotiation',
    title: 'Regional support contract',
    account: 'Harbourline Rail',
    amount: '€318,500',
    closeDate: 'Closes 29 Sep',
    owner: { name: 'Teodor Nagy' },
    health: 'on-track',
  },
];

const STAGES: PipelineStage[] = [
  { id: 'qualified', name: 'Qualified', count: 2, total: '€170,400', tone: 'info' },
  { id: 'proposal', name: 'Proposal', count: 2, total: '€1,304,900', tone: 'primary' },
  { id: 'negotiation', name: 'Negotiation', count: 1, total: '€318,500', tone: 'warning' },
  { id: 'won', name: 'Closed won', count: 0, total: '€0', tone: 'success', emptyLabel: 'Nothing closed this month yet' },
  { id: 'lost', name: 'Closed lost', count: 0, total: '€0', tone: 'error' },
];

function renderStage(stage: PipelineStage) {
  return DEALS.filter((deal) => deal.stageId === stage.id).map((deal) => (
    <DealCard
      key={deal.id}
      title={deal.title}
      account={deal.account}
      amount={deal.amount}
      closeDate={deal.closeDate}
      owner={deal.owner}
      health={deal.health}
      stalledFor={deal.stalledFor}
      onPress={noop}
      onMove={noop}
      testID={`deal-${deal.id}`}
    />
  ));
}

function Page({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20, gap: 16 }}>
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 520 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 520 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

/** The whole board. `auto` measures itself, so this is the desktop reading. */
export const Board: Story = {
  render: () => (
    <Page>
      <PipelineBoard
        stages={STAGES}
        renderStage={renderStage}
        accessibilityLabel="Sales pipeline"
        testID="board"
      />
    </Page>
  ),
};

/** One column at a time, behind a scrolling tab row — the phone reading. */
export const SingleColumn: Story = {
  render: () => {
    const [stageId, setStageId] = useState('proposal');
    return (
      <Page>
        <PipelineBoard
          stages={STAGES}
          renderStage={renderStage}
          layout="single"
          stageId={stageId}
          onStageChange={setStageId}
          accessibilityLabel="Sales pipeline"
          testID="board-single"
        />
      </Page>
    );
  },
};

export const Columns: Story = {
  render: () => (
    <Page>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <PipelineColumn name="Proposal" count={2} total="€1,304,900" width={288} testID="col-full">
          {renderStage(STAGES[1] as PipelineStage)}
        </PipelineColumn>
        <PipelineColumn
          name="Closed won"
          count={0}
          total="€0"
          width={288}
          emptyLabel="Nothing closed this month yet"
          testID="col-empty"
        />
        <PipelineColumn name="Qualified" loading count={3} total="€170,400" width={288} testID="col-loading" />
        <PipelineColumn
          name="Negotiation"
          count={12}
          total="€318,500"
          width={288}
          onLoadMore={noop}
          testID="col-more"
        >
          {renderStage(STAGES[2] as PipelineStage)}
        </PipelineColumn>
      </View>
    </Page>
  ),
};

/** Every state a card can be in, including the long-title case. */
export const Cards: Story = {
  render: () => (
    <Page>
      <Caption>Health, stage, actions and a title that will not fit</Caption>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <View style={{ width: 288 }}>
          <DealCard
            title="Fleet telematics rollout"
            account="Larkspur Freight"
            amount="€148,000"
            closeDate="Closes 30 Sep"
            owner={{ name: 'Marta Oyeleye' }}
            health="on-track"
            onPress={noop}
            onMove={noop}
            actions={
              <GlyphButton
                icon={RiMore2Line}
                size={32}
                onPress={noop}
                accessibilityLabel="More actions for Fleet telematics rollout"
              />
            }
            testID="card-healthy"
          />
        </View>
        <View style={{ width: 288 }}>
          <DealCard
            title="Theatre inventory platform, three sites"
            account="Quillon Health"
            amount="€1,240,000"
            closeDate="Closes 4 Nov"
            owner={{ name: 'Marta Oyeleye' }}
            health="stalled"
            stalledFor="23 days"
            stage="Proposal"
            onPress={noop}
            onMove={noop}
            testID="card-stalled"
          />
        </View>
        <View style={{ width: 240 }}>
          <DealCard
            title="An unusually long opportunity title that keeps going past every sensible boundary"
            account="Sablefield Studio and Manufacturing Partners"
            amount="€1,284,000,000"
            closeDate="Closes 18 October 2027"
            owner={{ name: 'Wilhelmina Featherstonehaugh' }}
            health="at-risk"
            onPress={noop}
            testID="card-long"
          />
        </View>
        <View style={{ width: 288 }}>
          <DealCard title="No amount, no owner, no signal" account="Unqualified inbound" testID="card-bare" />
        </View>
      </View>
    </Page>
  ),
};

export const BothThemes: Story = {
  render: () => (
    <BothModes>
      <PipelineBoard
        stages={STAGES.slice(0, 3)}
        renderStage={renderStage}
        layout="single"
        accessibilityLabel="Sales pipeline"
      />
    </BothModes>
  ),
};
