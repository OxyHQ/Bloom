import React, { useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ActivityFeed } from './ActivityFeed';
import { ActivityFeedFilters } from './ActivityFeedFilters';
import { ACTIVITY_FEED_KINDS } from './constants';
import type { ActivityFeedEntry, ActivityFeedKind } from './types';

const meta: Meta = {
  title: 'Blocks/CRM/ActivityFeed',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented accounts, pre-formatted days.
// ---------------------------------------------------------------------------

const ENTRIES: ActivityFeedEntry[] = [
  {
    id: 'a1',
    kind: 'call',
    day: 'Today',
    timestamp: '14:10',
    title: 'called Nora about the renewal',
    actor: { name: 'Marta Oyeleye' },
    body: 'She wants the three-site rollout split across two budget years. Finance has to confirm whether the second tranche can be invoiced in January, and she asked for the revised schedule before the board meets.',
    outcome: 'Renewal likely',
    outcomeTone: 'success',
    loggedBy: 'Marta Oyeleye',
  },
  {
    id: 'a2',
    kind: 'stage-change',
    day: 'Today',
    timestamp: '11:02',
    title: 'moved the deal from Qualified to Proposal',
    actor: { name: 'Teodor Nagy' },
    outcome: 'Proposal',
    outcomeTone: 'warning',
  },
  {
    id: 'a3',
    kind: 'email',
    day: 'Yesterday',
    timestamp: '17:45',
    title: 'sent the revised quote',
    actor: { name: 'Marta Oyeleye' },
    body: 'Attached the revised quote with the split schedule.',
    loggedBy: 'Automation',
  },
  {
    id: 'a4',
    kind: 'meeting',
    day: 'Yesterday',
    timestamp: '09:30',
    title: 'met the procurement team on site',
    actor: { name: 'Ines Coutinho' },
    body: 'Four people from procurement, two from clinical engineering. They walked us through the current scanner fleet and the maintenance contract that expires in March. The clinical lead is the one who has to sign off, and she was not in the room, which is the thing to fix before the next visit.',
    outcome: 'Second visit booked',
  },
  {
    id: 'a5',
    kind: 'note',
    day: '12 March',
    title: 'left a note',
    actor: { name: 'Teodor Nagy' },
    body: 'Do not call before 10:00 — their standup runs until then.',
  },
  {
    id: 'a6',
    kind: 'task',
    day: '12 March',
    timestamp: '08:15',
    title: 'completed "Send the security questionnaire"',
    actor: { name: 'Ines Coutinho' },
    outcome: 'Done',
    outcomeTone: 'success',
    loggedBy: 'Ines Coutinho',
  },
];

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

export const Feed: Story = {
  render: () => (
    <Page>
      <ActivityFeed entries={ENTRIES} accessibilityLabel="Activity" testID="feed" />
    </Page>
  ),
};

/** The filter row is controlled: the app decides which entries reach the feed. */
export const Filtered: Story = {
  render: () => {
    const [selected, setSelected] = useState<ActivityFeedKind[]>(['call', 'meeting']);
    const counts = useMemo(() => {
      const out: Partial<Record<ActivityFeedKind, number>> = {};
      for (const entry of ENTRIES) out[entry.kind] = (out[entry.kind] ?? 0) + 1;
      return out;
    }, []);
    const shown = selected.length === 0 ? ENTRIES : ENTRIES.filter((e) => selected.includes(e.kind));
    return (
      <Page>
        <ActivityFeedFilters
          kinds={ACTIVITY_FEED_KINDS}
          selected={selected}
          counts={counts}
          onToggle={(kind) =>
            setSelected((current) =>
              current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind],
            )
          }
          testID="filters"
        />
        <ActivityFeed entries={shown} accessibilityLabel="Activity" testID="feed-filtered" />
      </Page>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <Page>
      <Caption>Nothing logged, and nothing pretending otherwise</Caption>
      <ActivityFeed entries={[]} accessibilityLabel="Activity" testID="feed-empty" />
    </Page>
  ),
};

/** Narrow column, long bodies: the clamp and its reveal. */
export const NarrowAndLong: Story = {
  render: () => (
    <View style={{ width: 340 }}>
      <Page>
        <ActivityFeed entries={ENTRIES} bodyLines={2} accessibilityLabel="Activity" testID="feed-narrow" />
      </Page>
    </View>
  ),
};

export const BothThemes: Story = {
  render: () => (
    <BothModes>
      <ActivityFeed entries={ENTRIES.slice(0, 4)} accessibilityLabel="Activity" />
    </BothModes>
  ),
};
