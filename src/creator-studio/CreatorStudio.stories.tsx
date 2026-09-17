import React, { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileUpload } from '../file-upload/FileUpload';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiEditLine } from '../icons/remix/RiEditLine';
import { RiEyeLine } from '../icons/remix/RiEyeLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ArtworkUploader } from './ArtworkUploader';
import { AudienceBreakdown } from './AudienceBreakdown';
import { AudienceOverview } from './AudienceOverview';
import { CreditsEditor } from './CreditsEditor';
import { PayoutSummaryCard } from './PayoutSummaryCard';
import { PitchCard } from './PitchCard';
import { ReleaseCard } from './ReleaseCard';
import { ReleaseTimeline } from './ReleaseTimeline';
import { StreamsChart } from './StreamsChart';
import { TopTracksTable } from './TopTracksTable';
import { TrackMetadataForm } from './TrackMetadataForm';
import { TrackUploadRow } from './TrackUploadRow';
import { artworkDimensionsError } from './shared';
import type {
  AudienceMetric,
  CreatorRelease,
  PitchStatus,
  ReleaseAction,
  ReleaseStep,
  StreamsMetric,
  TopTrack,
  TrackCredit,
  TrackMetadata,
  TrackUploadStatus,
} from './types';

const meta: Meta = {
  title: 'Blocks/Music/Creator Studio',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented artists, releases, places and amounts.
// ---------------------------------------------------------------------------

/** A generated gradient cover: two hues, a soft disc, no external image. */
function cover(from: string, to: string, disc = '#ffffff'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="410" cy="220" r="120" fill="${disc}" fill-opacity="0.22"/><circle cx="190" cy="420" r="70" fill="${disc}" fill-opacity="0.14"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const COVERS = {
  lowTide: cover('#0f4c81', '#6ec6ca'),
  orchard: cover('#7a2e8e', '#f28bb2'),
  satellites: cover('#1f2937', '#f59e0b'),
  northbound: cover('#14532d', '#a3e635'),
  ember: cover('#7c2d12', '#fb923c'),
  velvet: cover('#312e81', '#818cf8'),
};

const spark = (base: number, drift: number, n = 14) =>
  Array.from({ length: n }, (_, i) => Math.round(base + drift * i + Math.sin(i * 1.3) * base * 0.08));

const METRICS: AudienceMetric[] = [
  { kind: 'listeners', label: 'Listeners', value: '48,210', delta: '+12.4%', trend: 'up', series: spark(3000, 90) },
  { kind: 'streams', label: 'Streams', value: '312,904', delta: '+8.1%', trend: 'up', series: spark(20000, 400) },
  { kind: 'followers', label: 'Followers', value: '9,846', delta: '0.0%', trend: 'flat', series: spark(700, 0) },
  { kind: 'saves', label: 'Saves', value: '6,120', delta: '-3.2%', trend: 'down', series: spark(520, -9) },
];

const DAYS = Array.from({ length: 28 }, (_, i) => `${i + 1} Mar`);
const streamsSeries = DAYS.map((label, i) => ({
  label,
  value: Math.round(8200 + i * 180 + Math.sin(i / 2) * 900 + (i >= 14 ? 5200 * Math.exp(-(i - 14) / 6) : 0)),
}));
const listenersSeries = streamsSeries.map((p) => ({ label: p.label, value: Math.round(p.value * 0.16) }));

const STREAMS: StreamsMetric[] = [
  { id: 'streams', label: 'Streams', data: streamsSeries, delta: 0.081 },
  { id: 'listeners', label: 'Listeners', data: listenersSeries, delta: 0.124 },
];

const TRACKS: TopTrack[] = [
  { id: 't1', title: 'Low Tide', subtitle: 'Low Tide · Single', artwork: COVERS.lowTide, streams: 118_402, listeners: 21_930, saves: 2_810, trend: 'up' },
  { id: 't2', title: 'Glass Orchard', subtitle: 'Glass Orchard · EP', artwork: COVERS.orchard, streams: 74_118, listeners: 14_002, saves: 1_402, trend: 'flat' },
  { id: 't3', title: 'Paper Satellites', subtitle: 'Paper Satellites · Album', artwork: COVERS.satellites, streams: 51_260, listeners: 9_844, saves: 980, trend: 'down' },
  { id: 't4', title: 'Northbound (Live at Harrow Hall)', subtitle: 'Northbound · Live', artwork: COVERS.northbound, streams: 33_907, listeners: 7_120, saves: 612, trend: 'new' },
  { id: 't5', title: 'Salt & Ember', subtitle: 'Paper Satellites · Album', artwork: COVERS.ember, streams: 21_444, listeners: 5_016, saves: 318, trend: 'up' },
  { id: 't6', title: 'Velvet Static', subtitle: 'Glass Orchard · EP', streams: 12_035, listeners: 2_911, saves: 140, trend: 'down' },
];

const BREAKDOWN = {
  cities: [
    { label: 'Port Alder', value: 6120 },
    { label: 'Veskamoor', value: 4410 },
    { label: 'Lunebridge', value: 3905 },
    { label: 'Caldera Bay', value: 2210 },
    { label: 'Orrin Falls', value: 1480 },
    { label: 'Hessel', value: 920 },
  ],
  countries: [
    { label: 'Marovia', value: 18200 },
    { label: 'Estland Isles', value: 11800 },
    { label: 'Corvall', value: 7420 },
    { label: 'Rasmark', value: 5210 },
    { label: 'Hollin', value: 3400 },
  ],
  ages: [
    { label: '18–24', value: 14200 },
    { label: '25–34', value: 18900 },
    { label: '35–44', value: 8800 },
    { label: '45–54', value: 4100 },
    { label: '55+', value: 2210 },
  ],
  genders: [
    { label: 'Women', value: 23100 },
    { label: 'Men', value: 21400 },
    { label: 'Non-binary', value: 2310 },
    { label: 'Not specified', value: 1400 },
  ],
  sources: [
    { label: 'Playlists', value: 21400 },
    { label: 'Profile', value: 11200 },
    { label: 'Search', value: 9800 },
    { label: 'Other', value: 5810 },
  ],
};

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((label, i) => ({
  label,
  value: [640, 720, 910, 860, 1120, 1284.5][i]!,
}));

const RELEASES: CreatorRelease[] = [
  { id: 'r1', title: 'Low Tide', artist: 'Juno Varga', type: 'single', releaseDate: '14 Mar 2026', status: 'live', trackCount: 1, artwork: COVERS.lowTide },
  { id: 'r2', title: 'Glass Orchard', artist: 'Juno Varga', type: 'ep', releaseDate: '2 May 2026', status: 'scheduled', trackCount: 5, artwork: COVERS.orchard },
  { id: 'r3', title: 'Paper Satellites', artist: 'Juno Varga', type: 'album', releaseDate: '20 Jun 2026', status: 'in-review', trackCount: 12, artwork: COVERS.satellites },
  { id: 'r4', title: 'Untitled demo', artist: 'Juno Varga', type: 'single', releaseDate: 'No date yet', status: 'draft', trackCount: 1 },
  {
    id: 'r5',
    title: 'Northbound',
    artist: 'Juno Varga & The Quiet Hours',
    type: 'single',
    releaseDate: '9 Jul 2026',
    status: 'rejected',
    statusReason: 'The artwork contains a web address. Remove text that is not the artist or release name and resubmit.',
    trackCount: 2,
    artwork: COVERS.northbound,
  },
  {
    id: 'r6',
    title: 'Salt & Ember (Remixes)',
    artist: 'Juno Varga',
    type: 'ep',
    releaseDate: '3 Feb 2025',
    status: 'takedown',
    statusReason: 'Taken down at your request on 12 Aug 2026.',
    trackCount: 4,
    artwork: COVERS.ember,
  },
];

const ACTIONS: ReleaseAction[] = [
  { label: 'View details', icon: RiEyeLine },
  { label: 'Edit metadata', icon: RiEditLine },
  { label: 'Duplicate', icon: RiFileCopyLine },
  { label: 'Delete', icon: RiDeleteBinLine, destructive: true },
];

const STEPS: ReleaseStep[] = [
  { id: 'uploaded', label: 'Uploaded', state: 'complete', date: '2 Mar' },
  { id: 'metadata', label: 'Metadata', state: 'complete', date: '3 Mar' },
  { id: 'artwork', label: 'Artwork', state: 'complete', date: '3 Mar' },
  { id: 'review', label: 'Review', state: 'current', date: 'In progress', description: 'Usually takes 2–3 days.' },
  { id: 'scheduled', label: 'Scheduled', state: 'upcoming' },
  { id: 'live', label: 'Live', state: 'upcoming', date: '14 Mar' },
];

const STEPS_REJECTED: ReleaseStep[] = [
  { id: 'uploaded', label: 'Uploaded', state: 'complete', date: '1 Jul' },
  { id: 'metadata', label: 'Metadata', state: 'complete', date: '1 Jul' },
  { id: 'artwork', label: 'Artwork', state: 'error', date: '4 Jul', description: 'The artwork contains a web address.' },
  { id: 'review', label: 'Review', state: 'upcoming' },
  { id: 'scheduled', label: 'Scheduled', state: 'upcoming' },
  { id: 'live', label: 'Live', state: 'upcoming' },
];

const GENRES = ['Alternative', 'Ambient', 'Electronic', 'Folk', 'Hip-hop', 'Indie pop', 'Jazz', 'R&B', 'Rock'].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}));
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Catalan', 'Instrumental'].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}));

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

function Page({ children, maxWidth = 1280 }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <ScrollView style={{ width: '100%', backgroundColor: theme.colors.background }}>
      <View style={{ width: '100%', maxWidth, alignSelf: 'center', paddingTop: 24, paddingBottom: 48, paddingLeft: 16, paddingRight: 16, gap: 24 }}>
        {children}
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text variant="headline-semibold" role="heading" style={{ color: theme.colors.text }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Two columns from `from` px of window, stacked below. */
function Columns({ children, from = 1024, ratio = [2, 1] }: { children: [React.ReactNode, React.ReactNode]; from?: number; ratio?: [number, number] }) {
  const { width } = useWindowDimensions();
  if (width < from) return <View style={{ gap: 16 }}>{children}</View>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ flexGrow: ratio[0], flexShrink: 1, flexBasis: 0, minWidth: 0 }}>{children[0]}</View>
      <View style={{ flexGrow: ratio[1], flexShrink: 1, flexBasis: 0, minWidth: 0 }}>{children[1]}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

function Dashboard() {
  const [period, setPeriod] = useState('28d');
  const [release, setRelease] = useState<string | undefined>('glass-orchard');
  const [moods, setMoods] = useState<string[]>(['Dreamy']);
  const [genres, setGenres] = useState<string[]>(['Indie pop']);
  const [pitch, setPitch] = useState('');
  const [status, setStatus] = useState<PitchStatus>('draft');
  return (
    <Page>
      <AudienceOverview
        metrics={METRICS}
        period={period}
        onPeriodChange={setPeriod}
        caption="Compared with the previous 28 days"
        testID="overview"
      />
      <Columns>
        <StreamsChart metrics={STREAMS} events={[{ index: 14, label: 'Low Tide · Single' }]} testID="streams" />
        <PayoutSummaryCard
          estimated="$1,284.50"
          delta={0.147}
          lastPayout={{ amount: '$1,120.00', date: '28 Aug' }}
          nextPayoutDate="28 Sep 2026"
          months={MONTHS}
          onViewStatements={() => {}}
          testID="payouts"
        />
      </Columns>
      <TopTracksTable tracks={TRACKS} summary="Last 28 days" testID="top-tracks" />
      <AudienceBreakdown {...BREAKDOWN} range="Last 28 days" testID="breakdown" />
      <Columns ratio={[1, 1]} from={900}>
        <PitchCard
          releases={[
            { value: 'glass-orchard', label: 'Glass Orchard · EP · 2 May' },
            { value: 'paper-satellites', label: 'Paper Satellites · Album · 20 Jun' },
          ]}
          release={release}
          onReleaseChange={setRelease}
          moods={['Dreamy', 'Energetic', 'Melancholic', 'Uplifting', 'Late night', 'Calm']}
          selectedMoods={moods}
          onSelectedMoodsChange={setMoods}
          genres={['Indie pop', 'Electronic', 'Folk', 'Alternative', 'Ambient']}
          selectedGenres={genres}
          onSelectedGenresChange={setGenres}
          pitch={pitch}
          onPitchChange={setPitch}
          status={status}
          submittedAt="Sent 17 Sep"
          onSubmit={() => {
            setStatus('submitting');
            setTimeout(() => setStatus('submitted'), 900);
          }}
          onEdit={() => setStatus('draft')}
          testID="pitch"
        />
        <PitchCard
          releases={[{ value: 'low-tide', label: 'Low Tide · Single · 14 Mar' }]}
          release="low-tide"
          onReleaseChange={() => {}}
          moods={[]}
          selectedMoods={[]}
          onSelectedMoodsChange={() => {}}
          genres={[]}
          selectedGenres={[]}
          onSelectedGenresChange={() => {}}
          pitch="A slow-building song about coming home."
          onPitchChange={() => {}}
          status="accepted"
          submittedAt="Sent 20 Feb"
        />
      </Columns>
    </Page>
  );
}

/** The artist dashboard — overview, streams with a release marker, payouts, top tracks, breakdown, pitching. Screenshot at 1280 and 390. */
export const DashboardPage: Story = {
  render: () => <Dashboard />,
};

export const DashboardPageDark: Story = {
  globals: { theme: 'dark' },
  render: () => <Dashboard />,
};

function Catalog() {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 640 ? 3 : 2;
  const rows: CreatorRelease[][] = [];
  for (let i = 0; i < RELEASES.length; i += columns) rows.push(RELEASES.slice(i, i + columns));
  return (
    <Page>
      <Section title="Releases">
        <View style={{ gap: 16 }}>
          {rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              {row.map((release) => (
                <View key={release.id} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
                  <ReleaseCard release={release} onPress={() => {}} actions={ACTIONS} testID={`release-${release.id}`} />
                </View>
              ))}
              {Array.from({ length: columns - row.length }, (_, i) => (
                <View key={`e${i}`} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }} />
              ))}
            </View>
          ))}
        </View>
      </Section>
      <Section title="As a list">
        <View style={{ gap: 8, maxWidth: 760 }}>
          {RELEASES.map((release) => (
            <ReleaseCard key={release.id} release={release} layout="row" onPress={() => {}} actions={ACTIONS} />
          ))}
        </View>
      </Section>
    </Page>
  );
}

/** The catalog: every status (draft, in review, scheduled, live, rejected with a reason, taken down) as grid cards and list rows. */
export const ReleasesCatalog: Story = {
  render: () => <Catalog />,
};

export const ReleasesCatalogDark: Story = {
  globals: { theme: 'dark' },
  render: () => <Catalog />,
};

const EMPTY_METADATA: TrackMetadata = {
  title: 'Glass Orchard',
  version: '',
  explicit: false,
  genre: 'indie pop',
  primaryArtists: ['Juno Varga'],
  featuredArtists: ['Ilse Marrow'],
  isrc: 'QZ-K6P-26-00412',
  language: 'english',
  lyrics: '',
  credits: [
    { id: 'c1', role: 'songwriter', name: 'Juno Varga' },
    { id: 'c2', role: 'producer', name: 'Teodor Brask' },
  ] as TrackCredit[],
};

function useSimulatedUpload(start: number) {
  const [progress, setProgress] = useState(start);
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => (p >= 96 ? start : p + 2)), 240);
    return () => clearInterval(timer);
  }, [start]);
  return progress;
}

function NewRelease() {
  const theme = useTheme();
  const progress = useSimulatedUpload(38);
  const [metadata, setMetadata] = useState<TrackMetadata>(EMPTY_METADATA);
  const [rows, setRows] = useState<TrackUploadStatus[]>(['queued', 'uploading', 'processing', 'ready', 'failed']);
  const [artwork, setArtwork] = useState<string | null>(COVERS.orchard);
  return (
    <Page maxWidth={1080}>
      <Section title="New release">
        <View style={{ backgroundColor: theme.colors.backgroundSecondary, borderRadius: 16, paddingTop: 20, paddingBottom: 16, paddingLeft: 12, paddingRight: 12 }}>
          <ReleaseTimeline steps={STEPS} orientation="horizontal" testID="timeline-h" />
        </View>
      </Section>

      <Columns from={900} ratio={[3, 2]}>
        <View style={{ gap: 24 }}>
          <Section title="Tracks">
            <FileUpload
              allowedExtensions={['wav', 'flac', 'aiff', 'mp3']}
              maxBytes={500 * 1024 * 1024}
              labels={{ prompt: 'Drop audio files here or' }}
              accessibilityLabel="Upload audio"
            />
            <View style={{ gap: 8 }}>
              {rows.map((status) => (
                <TrackUploadRow
                  key={status}
                  testID={`upload-${status}`}
                  fileName={
                    {
                      queued: '05 Velvet Static.wav',
                      uploading: '02 Glass Orchard (Extended Mix).wav',
                      processing: '03 Paper Satellites.flac',
                      ready: '01 Low Tide.wav',
                      failed: '04 Northbound (Live).aiff',
                    }[status]
                  }
                  size={{ queued: 51_200_000, uploading: 88_400_000, processing: 41_900_000, ready: 46_300_000, failed: 120_000_000 }[status]}
                  status={status}
                  progress={progress}
                  remaining={`About ${Math.max(1, Math.round((100 - progress) / 4))} s left`}
                  duration="3:42"
                  error="The connection dropped at 64%. Check your network and try again."
                  onRetry={() => {}}
                  onRemove={() => setRows((r) => r.filter((s) => s !== status))}
                />
              ))}
            </View>
          </Section>
          <Section title="Track details">
            <TrackMetadataForm value={metadata} onChange={setMetadata} genres={GENRES} languages={LANGUAGES} testID="metadata" />
          </Section>
        </View>
        <View style={{ gap: 24 }}>
          <Section title="Cover">
            <ArtworkUploader artwork={artwork} onRemove={() => setArtwork(null)} onFileSelected={() => {}} testID="artwork" />
          </Section>
          <Section title="Progress">
            <ReleaseTimeline steps={STEPS} testID="timeline-v" />
          </Section>
        </View>
      </Columns>
    </Page>
  );
}

/** The new-release flow: timeline, audio drop zone, upload rows in every state, metadata with credits, artwork. */
export const NewReleaseFlow: Story = {
  render: () => <NewRelease />,
};

export const NewReleaseFlowDark: Story = {
  globals: { theme: 'dark' },
  render: () => <NewRelease />,
};

/** Artwork states: empty drop zone, a preview, and a too-small image rejected with a message. */
export const Artwork: Story = {
  render: function ArtworkStates() {
    return (
      <Page maxWidth={1080}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          <View style={{ width: 280 }}>
            <ArtworkUploader onFileSelected={() => {}} testID="artwork-empty" />
          </View>
          <View style={{ width: 280 }}>
            <ArtworkUploader artwork={COVERS.velvet} onRemove={() => {}} testID="artwork-preview" />
          </View>
          <View style={{ width: 280 }}>
            <ArtworkUploader
              artwork={COVERS.satellites}
              onRemove={() => {}}
              error={artworkDimensionsError(1400, 1400)}
              testID="artwork-error"
            />
          </View>
        </View>
      </Page>
    );
  },
};

/** Timelines: in review (vertical and horizontal) and a rejected artwork step. */
export const Timelines: Story = {
  render: () => (
    <Page maxWidth={960}>
      <Columns from={700} ratio={[1, 1]}>
        <ReleaseTimeline steps={STEPS} />
        <ReleaseTimeline steps={STEPS_REJECTED} />
      </Columns>
      <ReleaseTimeline steps={STEPS_REJECTED} orientation="horizontal" />
    </Page>
  ),
};

/** Credits on their own, narrow: the role select stacks over name + delete. */
export const CreditsNarrow: Story = {
  render: function CreditsStory() {
    const [credits, setCredits] = useState<TrackCredit[]>(EMPTY_METADATA.credits);
    return (
      <Page maxWidth={400}>
        <CreditsEditor credits={credits} onCreditsChange={setCredits} testID="credits" />
      </Page>
    );
  },
};
