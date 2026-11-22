import { EvictionReportCard, EvictionTimeline } from '@oxy.so/bloom/eviction';
import { RiGroupLine, RiToolsLine } from '@oxy.so/bloom/icons';
import { PlaceReviewSummary, WriteReviewPrompt } from '@oxy.so/bloom/place-reviews';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const attend = (_attending: boolean) => {};

const REPORT = {
  date: 'Tuesday, 23 September',
  time: '09:00',
  relativeLabel: 'in 3 days',
  status: 'scheduled' as const,
  area: 'Calle del Almendro, Carabanchel, Madrid',
  household: ['Family with minors', 'Two children under 10'],
  description:
    'A mother and her two children face eviction from the flat they have rented for nine years after the building was sold. The neighbourhood assembly is asking people to gather at the door from 08:30.',
  attendeesLabel: '48 people will attend',
  organisationsLabel: '3 organisations supporting',
  verified: true,
};

const EVENTS = [
  { id: 'p', kind: 'published' as const, title: 'Reported', date: '12 Sep', source: 'pah.example' },
  { id: 'd', kind: 'date-set' as const, title: 'Date set', date: '15 Sep' },
  { id: 'm', kind: 'mobilisation' as const, title: 'Gathering at the door', upcoming: true },
];

const CATEGORIES = [
  { label: 'Maintenance', value: 3.1, icon: RiToolsLine },
  { label: 'Neighbours', value: 4.7, icon: RiGroupLine },
];

export const EVICTION_CASES: ParityCase[] = [
  {
    name: 'EvictionReportCard',
    language: () => toElement(L.EvictionReportCard(REPORT)),
    bloom: () => <EvictionReportCard {...REPORT} />,
  },
  ...[false, true].map((attending) => ({
    name: `EvictionReportCard ${attending ? 'attending' : 'not attending'}, 2 lines, its actions`,
    language: () =>
      toElement(
        L.EvictionReportCard({
          ...REPORT,
          status: 'postponed',
          attending: [attending, attend],
          onShare: press,
          onContactSupport: press,
        }).lines(2),
      ),
    bloom: () => (
      <EvictionReportCard
        {...REPORT}
        status="postponed"
        attending={attending}
        onAttendingChange={attend}
        onShare={press}
        onContactSupport={press}
        numberOfLines={2}
      />
    ),
  })),
  {
    name: 'EvictionTimeline',
    language: () => toElement(L.EvictionTimeline(EVENTS)),
    bloom: () => <EvictionTimeline events={EVENTS} />,
  },
  {
    name: 'EvictionTimeline its sources, named',
    language: () =>
      toElement(
        L.EvictionTimeline(EVENTS, { formatSource: (s) => `via ${s}` }).label('What happened'),
      ),
    bloom: () => (
      <EvictionTimeline
        events={EVENTS}
        formatSource={(s) => `via ${s}`}
        accessibilityLabel="What happened"
      />
    ),
  },
  {
    name: 'PlaceReviewSummary',
    language: () => toElement(L.PlaceReviewSummary(3.8)),
    bloom: () => <PlaceReviewSummary rating={3.8} />,
  },
  {
    name: 'PlaceReviewSummary its count, categories and rates',
    language: () =>
      toElement(
        L.PlaceReviewSummary('4.2', {
          title: 'Residents say',
          reviewCount: 18,
          categories: CATEGORIES,
          depositReturnedRate: 0.72,
          recommendRate: 0.81,
        }),
      ),
    bloom: () => (
      <PlaceReviewSummary
        rating="4.2"
        title="Residents say"
        reviewCount={18}
        categories={CATEGORIES}
        depositReturnedRate={0.72}
        recommendRate={0.81}
      />
    ),
  },
  {
    name: 'WriteReviewPrompt',
    language: () => toElement(L.WriteReviewPrompt('Calle de los Tilos 27', { onStart: press })),
    bloom: () => <WriteReviewPrompt buildingTitle="Calle de los Tilos 27" onStart={press} />,
  },
  {
    name: 'WriteReviewPrompt dismissible, media, its words',
    language: () =>
      toElement(
        L.WriteReviewPrompt('Calle de los Tilos 27', {
          onStart: press,
          onDismiss: press,
          title: 'Lived here?',
          actionLabel: 'Review it',
          media: L.Text('🏠'),
        }),
      ),
    bloom: () => (
      <WriteReviewPrompt
        buildingTitle="Calle de los Tilos 27"
        onStart={press}
        onDismiss={press}
        title="Lived here?"
        actionLabel="Review it"
        media={<Text>🏠</Text>}
      />
    ),
  },
];
