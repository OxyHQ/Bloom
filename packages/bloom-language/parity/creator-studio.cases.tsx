import {
  ArtistChipsInput,
  ArtworkUploader,
  AudienceBreakdown,
  AudienceOverview,
  CreditsEditor,
  IsrcField,
  PayoutSummaryCard,
  PitchCard,
  ReleaseCard,
  ReleaseStatusBadge,
  ReleaseTimeline,
  StreamsChart,
  TopTracksTable,
  TrackMetadataForm,
  TrackUploadRow,
} from '@oxy.so/bloom/creator-studio';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const pick = () => null;
const COVER = 'https://cdn.oxy.so/p.jpg';
const METRICS = [
  {
    kind: 'listeners' as const,
    label: 'Listeners',
    value: '48,210',
    delta: '+12.4%',
    trend: 'up' as const,
    series: [3, 5, 4, 6, 8],
  },
  {
    kind: 'streams' as const,
    label: 'Streams',
    value: '312,904',
    delta: '0.0%',
    trend: 'flat' as const,
  },
  {
    kind: 'saves' as const,
    label: 'Saves',
    value: '6,120',
    delta: '-3.2%',
    trend: 'down' as const,
  },
];
const POINTS = ['1 Mar', '2 Mar', '3 Mar', '4 Mar', '5 Mar', '6 Mar'].map((label, i) => ({
  label,
  value: 8200 + i * 900,
}));
const STREAMS = [
  { id: 'streams', label: 'Streams', data: POINTS, delta: 0.081 },
  { id: 'listeners', label: 'Listeners', data: POINTS.map((p) => ({ ...p, value: p.value / 5 })) },
];
const EVENTS = [{ index: 3, label: 'Low Tide · Single' }];
const TRACKS = [
  {
    id: 't1',
    title: 'Low Tide',
    subtitle: 'Low Tide · Single',
    artwork: COVER,
    streams: 118_402,
    listeners: 21_930,
    saves: 2_810,
    trend: 'up' as const,
  },
  {
    id: 't2',
    title: 'Glass Orchard',
    streams: 74_118,
    listeners: 14_002,
    saves: 1_402,
    trend: 'new' as const,
  },
];
const datum = (labels: string[]) => labels.map((label, i) => ({ label, value: 1000 - i * 200 }));
const BREAKDOWN = {
  cities: datum(['Port Alder', 'Veskamoor', 'Lunebridge']),
  countries: datum(['Marovia', 'Corvall']),
  ages: datum(['18–24', '25–34', '35–44']),
  genders: datum(['Female', 'Male', 'Other']),
  sources: datum(['Playlists', 'Profile', 'Search']),
};
const RELEASE = {
  id: 'r1',
  title: 'Low Tide',
  artist: 'Maren Holt',
  type: 'single' as const,
  releaseDate: '14 Mar 2026',
  status: 'rejected' as const,
  statusReason: 'The artwork has text on it.',
  trackCount: 2,
  artwork: COVER,
};
const ACTIONS = [
  { label: 'Edit', onPress: press },
  { label: 'Delete', destructive: true },
];
const STEPS = [
  { id: 'a', label: 'Artwork', state: 'complete' as const, date: '12 Mar' },
  { id: 'b', label: 'Review', state: 'current' as const, description: 'Usually 2–3 days' },
  { id: 'c', label: 'Live', state: 'upcoming' as const },
];
const UPLOADS = ['queued', 'uploading', 'processing', 'ready', 'failed'] as const;
const METADATA = {
  title: 'Low Tide',
  version: '',
  explicit: false,
  genre: 'pop',
  primaryArtists: ['Maren Holt'],
  featuredArtists: [],
  isrc: 'GBAYE2600001',
  language: 'en',
  lyrics: '',
  credits: [{ id: 'c1', role: 'producer', name: 'Ilse Varga' }],
};
const OPTIONS = [
  { value: 'pop', label: 'Pop' },
  { value: 'en', label: 'English' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr'].map((label, i) => ({ label, value: 900 + i * 120 }));
const PITCH = {
  releases: [{ value: 'r1', label: 'Low Tide' }],
  release: 'r1',
  onReleaseChange: set,
  moods: ['Calm', 'Hopeful', 'Dark'],
  selectedMoods: ['Calm'],
  onSelectedMoodsChange: set,
  genres: ['Pop', 'Folk'],
  selectedGenres: [],
  onSelectedGenresChange: set,
  pitch: 'A slow song about the sea.',
  onPitchChange: set,
  onSubmit: press,
  onEdit: press,
};

export const CREATOR_STUDIO_CASES: ParityCase[] = [
  {
    name: 'AudienceOverview',
    language: () =>
      toElement(L.AudienceOverview(METRICS, ['28d', set], { caption: 'Against the last 28 days' })),
    bloom: () => (
      <AudienceOverview
        metrics={METRICS}
        period="28d"
        onPeriodChange={set}
        caption="Against the last 28 days"
      />
    ),
  },
  {
    name: 'StreamsChart',
    language: () =>
      toElement(
        L.StreamsChart(STREAMS, { events: EVENTS, height: '320' }).label('Streams this month'),
      ),
    bloom: () => (
      <StreamsChart
        metrics={STREAMS}
        events={EVENTS}
        height={320}
        accessibilityLabel="Streams this month"
      />
    ),
  },
  {
    name: 'TopTracksTable',
    language: () =>
      toElement(
        L.TopTracksTable(TRACKS, {
          summary: L.Text('Last 28 days'),
          toolbar: L.Text('Export'),
          pageSize: 5,
        }),
      ),
    bloom: () => (
      <TopTracksTable
        tracks={TRACKS}
        summary={<Text>Last 28 days</Text>}
        toolbar={<Text>Export</Text>}
        pageSize={5}
      />
    ),
  },
  {
    name: 'AudienceBreakdown',
    language: () => toElement(L.AudienceBreakdown({ ...BREAKDOWN, range: 'Last 28 days' })),
    bloom: () => <AudienceBreakdown {...BREAKDOWN} range="Last 28 days" />,
  },
  ...ENUMS.releaseCardLayout.map((layout) => ({
    name: `ReleaseCard ${layout}`,
    language: () =>
      toElement(L.ReleaseCard(RELEASE, { actions: ACTIONS }).style(layout).onPress(press)),
    bloom: () => (
      <ReleaseCard release={RELEASE} actions={ACTIONS} layout={layout} onPress={press} />
    ),
  })),
  ...ENUMS.releaseStatusBadgeSize.map((size) => ({
    name: `ReleaseStatusBadge ${size}`,
    language: () => toElement(L.ReleaseStatusBadge('scheduled').size(size)),
    bloom: () => <ReleaseStatusBadge status="scheduled" size={size} />,
  })),
  {
    name: 'ReleaseStatusBadge with its own words',
    language: () => toElement(L.ReleaseStatusBadge('live', { label: 'Out now' })),
    bloom: () => <ReleaseStatusBadge status="live" label="Out now" />,
  },
  ...ENUMS.axis.map((axis) => ({
    name: `ReleaseTimeline ${axis}`,
    language: () => toElement(L.ReleaseTimeline(STEPS).axis(axis).label('Release progress')),
    bloom: () => (
      <ReleaseTimeline steps={STEPS} orientation={axis} accessibilityLabel="Release progress" />
    ),
  })),
  ...UPLOADS.map((status) => ({
    name: `TrackUploadRow ${status}`,
    language: () =>
      toElement(
        L.TrackUploadRow('low-tide.wav', status, {
          size: 12_400_000,
          progress: 40,
          remaining: 'About 20 s left',
          duration: '3:42',
          onRetry: press,
          onRemove: press,
        }),
      ),
    bloom: () => (
      <TrackUploadRow
        fileName="low-tide.wav"
        status={status}
        size={12_400_000}
        progress={40}
        remaining="About 20 s left"
        duration="3:42"
        onRetry={press}
        onRemove={press}
      />
    ),
  })),
  {
    name: 'TrackMetadataForm',
    language: () =>
      toElement(
        L.TrackMetadataForm([METADATA, set], {
          genres: OPTIONS,
          languages: OPTIONS,
          errors: { title: 'Required' },
        }),
      ),
    bloom: () => (
      <TrackMetadataForm
        value={METADATA}
        onChange={set}
        genres={OPTIONS}
        languages={OPTIONS}
        errors={{ title: 'Required' }}
      />
    ),
  },
  {
    name: 'TrackMetadataForm disabled, no credits',
    language: () =>
      toElement(
        L.TrackMetadataForm([METADATA, set], {
          genres: OPTIONS,
          languages: OPTIONS,
          showCredits: false,
        }).disabled(),
      ),
    bloom: () => (
      <TrackMetadataForm
        value={METADATA}
        onChange={set}
        genres={OPTIONS}
        languages={OPTIONS}
        showCredits={false}
        disabled
      />
    ),
  },
  {
    name: 'ArtistChipsInput',
    language: () =>
      toElement(
        L.ArtistChipsInput('Primary artists', [['Maren Holt', 'Ilse Varga'], set], {
          hint: 'Up to 3',
          max: 3,
          required: true,
        }),
      ),
    bloom: () => (
      <ArtistChipsInput
        label="Primary artists"
        values={['Maren Holt', 'Ilse Varga']}
        onValuesChange={set}
        hint="Up to 3"
        max={3}
        required
      />
    ),
  },
  {
    name: 'ArtistChipsInput disabled',
    language: () => toElement(L.ArtistChipsInput('Featured', [[], set]).disabled()),
    bloom: () => <ArtistChipsInput label="Featured" values={[]} onValuesChange={set} disabled />,
  },
  {
    name: 'IsrcField',
    language: () => toElement(L.IsrcField(['GBAYE2600001', set])),
    bloom: () => <IsrcField value="GBAYE2600001" onChangeText={set} />,
  },
  {
    name: 'IsrcField invalid, disabled',
    language: () => toElement(L.IsrcField(['GB-12', set], { label: 'Code' }).disabled()),
    bloom: () => <IsrcField value="GB-12" onChangeText={set} label="Code" disabled />,
  },
  {
    name: 'CreditsEditor',
    language: () => toElement(L.CreditsEditor([METADATA.credits, set])),
    bloom: () => <CreditsEditor credits={METADATA.credits} onCreditsChange={set} />,
  },
  {
    name: 'CreditsEditor empty, disabled',
    language: () => toElement(L.CreditsEditor([[], set]).disabled()),
    bloom: () => <CreditsEditor credits={[]} onCreditsChange={set} disabled />,
  },
  {
    name: 'ArtworkUploader empty',
    language: () =>
      toElement(L.ArtworkUploader(null, { onFileSelected: set, onPickFiles: pick, size: '256' })),
    bloom: () => (
      <ArtworkUploader artwork={null} onFileSelected={set} onPickFiles={pick} size={256} />
    ),
  },
  {
    name: 'ArtworkUploader with a cover',
    language: () => toElement(L.ArtworkUploader(COVER, { onRemove: press, size: '256' })),
    bloom: () => <ArtworkUploader artwork={COVER} onRemove={press} size={256} />,
  },
  {
    name: 'ArtworkUploader with an error, disabled',
    language: () =>
      toElement(L.ArtworkUploader(null, { error: 'Too small', size: '256' }).disabled()),
    bloom: () => <ArtworkUploader artwork={null} error="Too small" size={256} disabled />,
  },
  {
    name: 'PayoutSummaryCard',
    language: () =>
      toElement(
        L.PayoutSummaryCard('$1,284.50', {
          delta: 0.12,
          lastPayout: { amount: '$1,102.00', date: '1 Mar' },
          nextPayoutDate: '1 Apr',
          months: MONTHS,
          onViewStatements: press,
        }),
      ),
    bloom: () => (
      <PayoutSummaryCard
        estimated="$1,284.50"
        delta={0.12}
        lastPayout={{ amount: '$1,102.00', date: '1 Mar' }}
        nextPayoutDate="1 Apr"
        months={MONTHS}
        onViewStatements={press}
      />
    ),
  },
  ...(['draft', 'submitted', 'declined'] as const).map((status) => ({
    name: `PitchCard ${status}`,
    language: () => toElement(L.PitchCard({ ...PITCH, status, submittedAt: 'Sent 2 Mar' })),
    bloom: () => <PitchCard {...PITCH} status={status} submittedAt="Sent 2 Mar" />,
  })),
];
