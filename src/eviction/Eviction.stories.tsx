import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EvictionReportCard } from './EvictionReportCard';
import { EvictionTimeline } from './EvictionTimeline';
import type { EvictionEvent, EvictionReportCardProps, EvictionStatus } from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Eviction',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented reports. Areas are coarse on purpose: a neighbourhood
//  or a street with no number, never an address.
// ---------------------------------------------------------------------------

type Report = Omit<EvictionReportCardProps, 'attending' | 'onAttendingChange'> & { id: string; past: boolean };

const REPORTS: Report[] = [
  {
    id: 'r1',
    past: false,
    date: 'Tuesday, 23 September',
    time: '09:00',
    relativeLabel: 'in 3 days',
    status: 'scheduled',
    area: 'Calle del Almendro, Carabanchel, Madrid',
    household: ['Family with minors', 'Two children under 10'],
    description:
      'A mother and her two children face eviction from the flat they have rented for nine years after the building was sold. Social services have not offered alternative housing. The neighbourhood assembly is asking people to gather at the door from 08:30.',
    attendeesLabel: '48 people will attend',
    organisationsLabel: '3 organisations supporting',
    verified: true,
  },
  {
    id: 'r2',
    past: false,
    date: 'Thursday, 2 October',
    time: '10:30',
    relativeLabel: 'in 12 days',
    status: 'postponed',
    statusLabel: 'Postponed',
    area: 'Barrio del Pilar, Madrid',
    household: ['Elderly person', 'Reduced mobility'],
    description:
      'An 81-year-old neighbour with reduced mobility. The first date was postponed after a medical report; a new date has been set.',
    attendeesLabel: '17 people will attend',
    organisationsLabel: '1 organisation supporting',
    verified: true,
  },
  {
    id: 'r3',
    past: false,
    date: 'Monday, 29 September',
    time: '08:00',
    relativeLabel: 'in 9 days',
    status: 'scheduled',
    area: 'Orcasitas, Madrid',
    household: ['Single-parent family'],
    description: 'Reported by a neighbour this morning. Waiting for the support group to confirm the details.',
    attendeesLabel: '5 people will attend',
  },
  {
    id: 'p1',
    past: true,
    date: 'Wednesday, 10 September',
    time: '09:00',
    relativeLabel: '10 days ago',
    status: 'suspended',
    area: 'Calle de la Ribera, Vallecas, Madrid',
    household: ['Family with minors'],
    description:
      'Suspended at the door after more than a hundred neighbours gathered and the court agreed to review the social services report.',
    attendeesLabel: '112 people attended',
    organisationsLabel: '4 organisations supporting',
    verified: true,
  },
  {
    id: 'p2',
    past: true,
    date: 'Friday, 29 August',
    time: '11:00',
    relativeLabel: '3 weeks ago',
    status: 'executed',
    area: 'Usera, Madrid',
    household: ['Elderly couple'],
    description: 'The eviction went ahead. The support group is helping the couple with temporary accommodation.',
    attendeesLabel: '36 people attended',
    organisationsLabel: '2 organisations supporting',
    verified: true,
  },
  {
    id: 'p3',
    past: true,
    date: 'Tuesday, 19 August',
    relativeLabel: '1 month ago',
    status: 'cancelled',
    area: 'Latina, Madrid',
    description: 'The owner withdrew the claim after reaching an agreement with the tenants.',
    attendeesLabel: '22 people attended',
  },
];

const HISTORY: EvictionEvent[] = [
  { kind: 'published', title: 'Report published', date: '2 Sep 2026', source: 'Neighbourhood assembly' },
  { kind: 'date-set', title: 'Eviction date set for 16 September', date: '4 Sep 2026', source: 'Court notice shared by the family' },
  { kind: 'mobilisation', title: 'Support call shared', date: '5 Sep 2026', description: 'Three housing groups joined the call.', source: 'Tenants’ union' },
  { kind: 'postponed', title: 'Postponed to 23 September', date: '15 Sep 2026', description: 'The court accepted a request to review the family’s situation.', source: 'Family’s lawyer' },
  { kind: 'date-set', title: 'Eviction scheduled', date: '23 Sep 2026, 09:00', upcoming: true },
];

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: '100%', minHeight: '100%', alignItems: 'flex-start', backgroundColor: theme.colors.background }}>
      <View
        style={{
          width,
          paddingTop: 32,
          paddingBottom: 48,
          paddingLeft: width < 600 ? 16 : 40,
          paddingRight: width < 600 ? 16 : 40,
          gap: 24,
          backgroundColor: theme.colors.background,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function useAttending() {
  const [attending, setAttending] = useState<Record<string, boolean>>({ r1: true });
  return (id: string) => ({
    attending: attending[id] ?? false,
    onAttendingChange: (next: boolean) => setAttending((a) => ({ ...a, [id]: next })),
  });
}

// ---------------------------------------------------------------------------
//  List with a filter
// ---------------------------------------------------------------------------

function EvictionList({ width }: { width: number }) {
  const theme = useTheme();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const attend = useAttending();
  const columns = width >= 1000 ? 3 : width >= 700 ? 2 : 1;
  const gap = 16;
  const inner = width - (width < 600 ? 32 : 80);
  const cardWidth = Math.floor((inner - gap * (columns - 1)) / columns);
  const shown = REPORTS.filter((r) => r.past === (tab === 'past'));

  return (
    <Page width={width}>
      <View style={{ gap: 4 }}>
        <Text role="heading" aria-level={1} variant={columns > 1 ? 'title-1-semibold' : 'title-2-semibold'} style={{ color: theme.colors.text }}>
          Evictions near you
        </Text>
        <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
          Reported by neighbours so people can come and support. Locations are approximate.
        </Text>
      </View>
      <SegmentedControl
        label="Show evictions"
        type="tabs"
        size="large"
        value={tab}
        onChange={setTab}
        style={{ alignSelf: columns > 1 ? 'flex-start' : 'stretch' }}
      >
        <SegmentedControlItem value="upcoming">
          <SegmentedControlItemText>Upcoming</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="past">
          <SegmentedControlItemText>Past</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, alignItems: 'flex-start' }}>
        {shown.map(({ id, past: _past, ...report }) => (
          <View key={id} style={{ width: cardWidth }}>
            <EvictionReportCard
              {...report}
              {...(report.status === 'scheduled' || report.status === 'postponed'
                ? { ...attend(id), onShare: noop, onContactSupport: report.organisationsLabel ? noop : undefined }
                : { onShare: noop })}
            />
          </View>
        ))}
      </View>
    </Page>
  );
}

/** Upcoming and past reports in a grid at 1280, with the status filter. */
export const ListWide: Story = {
  name: 'List — 1280',
  render: () => <EvictionList width={1280} />,
};

export const ListNarrow: Story = {
  name: 'List — 375',
  render: () => <EvictionList width={375} />,
};

export const ListWideDark: Story = {
  name: 'List — 1280, dark',
  globals: { theme: 'dark' },
  render: () => <EvictionList width={1280} />,
};

export const ListNarrowDark: Story = {
  name: 'List — 375, dark',
  globals: { theme: 'dark' },
  render: () => <EvictionList width={375} />,
};

// ---------------------------------------------------------------------------
//  Report detail
// ---------------------------------------------------------------------------

function ReportDetail({ width }: { width: number }) {
  const theme = useTheme();
  const attend = useAttending();
  const wide = width >= 900;
  const { id, past: _past, ...report } = REPORTS[0]!;
  const card = (
    <EvictionReportCard
      {...report}
      numberOfLines={0}
      {...attend(id)}
      onShare={noop}
      onContactSupport={noop}
    />
  );
  const history = (
    <View style={{ gap: 16 }}>
      <Text role="heading" aria-level={2} variant="title-3-semibold" style={{ color: theme.colors.text }}>
        Case history
      </Text>
      <EvictionTimeline events={HISTORY} />
    </View>
  );
  return (
    <Page width={width}>
      {wide ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 40 }}>
          <View style={{ width: 460 }}>{card}</View>
          <View style={{ flex: 1, minWidth: 0 }}>{history}</View>
        </View>
      ) : (
        <>
          {card}
          {history}
        </>
      )}
    </Page>
  );
}

/** One report opened: the full description and the case history beside it. */
export const DetailWide: Story = {
  name: 'Report detail — 1280',
  render: () => <ReportDetail width={1280} />,
};

export const DetailNarrow: Story = {
  name: 'Report detail — 375',
  render: () => <ReportDetail width={375} />,
};

export const DetailNarrowDark: Story = {
  name: 'Report detail — 375, dark',
  globals: { theme: 'dark' },
  render: () => <ReportDetail width={375} />,
};

// ---------------------------------------------------------------------------
//  Statuses
// ---------------------------------------------------------------------------

const STATUSES: EvictionStatus[] = ['scheduled', 'postponed', 'suspended', 'executed', 'cancelled'];

function Statuses() {
  return (
    <Page width={1280}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {STATUSES.map((status) => (
          <View key={status} style={{ width: 280 }}>
            <EvictionReportCard
              date="Tuesday, 23 September"
              time="09:00"
              relativeLabel={status === 'scheduled' || status === 'postponed' ? 'in 3 days' : '2 days ago'}
              status={status}
              area="Carabanchel, Madrid"
            />
          </View>
        ))}
      </View>
    </Page>
  );
}

/** The five statuses: scheduled warning, postponed info, suspended success, executed solid neutral, cancelled neutral. */
export const AllStatuses: Story = {
  render: () => <Statuses />,
};

export const AllStatusesDark: Story = {
  name: 'All statuses, dark',
  globals: { theme: 'dark' },
  render: () => <Statuses />,
};
