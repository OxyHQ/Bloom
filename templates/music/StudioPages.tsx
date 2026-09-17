import React, { useEffect, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';

import { AppShell } from '../../src/app-shell';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import {
  ArtworkUploader,
  AudienceBreakdown,
  AudienceOverview,
  CreditsEditor,
  PayoutSummaryCard,
  PitchCard,
  ReleaseCard,
  ReleaseTimeline,
  StreamsChart,
  TopTracksTable,
  TrackMetadataForm,
  TrackUploadRow,
  type PitchStatus,
  type ReleaseAction,
  type ReleaseStatus,
  type TrackCredit,
  type TrackMetadata,
  type TrackUploadStatus,
} from '../../src/creator-studio';
import { FileUpload } from '../../src/file-upload';
import {
  RiAddFill,
  RiAlbumLine,
  RiDashboardLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFileCopyLine,
  RiGroupLine,
  RiMegaphoneLine,
  RiMusic2Fill,
  RiSettings4Line,
  RiUploadCloud2Line,
} from '../../src/icons/remix';
import { FilterChips } from '../../src/media-shelf';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../../src/segmented-control';
import type { SidebarNavItem } from '../../src/sidebar';
import type { WebCssStyle } from '../../src/styles/web-view-style';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import {
  ALBUM_BY_ID,
  ARTIST_BY_ID,
  STUDIO_BREAKDOWN,
  STUDIO_EVENTS,
  STUDIO_GENRES,
  STUDIO_LANGUAGES,
  STUDIO_METRICS,
  STUDIO_MOODS,
  STUDIO_PAYOUT_MONTHS,
  STUDIO_PITCH_GENRES,
  STUDIO_RELEASES,
  STUDIO_STEPS,
  STUDIO_STREAMS,
  STUDIO_TOP_TRACKS,
} from './data';

/**
 * The creator studio: a separate app frame for artists, on `AppShell` with the
 * studio mark in the sidebar. Three pages — the dashboard (audience, streams
 * with a release marker, payouts, top tracks, the audience breakdown), the
 * release catalogue, and the new-release flow (uploads, metadata, credits,
 * artwork, the distribution timeline and the editorial pitch).
 */

export type StudioPage = 'dashboard' | 'releases' | 'new-release';

const FRAME: WebCssStyle =
  Platform.OS === 'web'
    ? { alignSelf: 'stretch', marginTop: -24, marginBottom: -24, marginLeft: -24, marginRight: -24 }
    : { flex: 1, width: '100%' };

const NAV: SidebarNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: RiDashboardLine, href: '#dashboard' },
  { key: 'releases', label: 'Releases', icon: RiAlbumLine, badge: STUDIO_RELEASES.length, href: '#releases' },
  { key: 'new-release', label: 'New release', icon: RiUploadCloud2Line, href: '#new-release' },
  { key: 'audience', label: 'Audience', icon: RiGroupLine, href: '#audience' },
  { key: 'pitching', label: 'Pitching', icon: RiMegaphoneLine, href: '#pitching' },
];

const SECONDARY: SidebarNavItem[] = [{ key: 'settings', label: 'Settings', icon: RiSettings4Line }];

function StudioMark() {
  const theme = useTheme();
  const { accent } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: accent[500],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RiMusic2Fill width={16} height={16} fill={theme.colors.primaryForeground} />
    </View>
  );
}

export function StudioApp({ initialPage = 'dashboard' }: { initialPage?: StudioPage }) {
  const [page, setPage] = useState<StudioPage>(initialPage);
  const [navOpen, setNavOpen] = useState(false);
  const artist = ARTIST_BY_ID['lumen-vale']!;

  const title =
    page === 'dashboard' ? `Welcome back, ${artist.name}` : page === 'releases' ? 'Releases' : 'New release';

  return (
    <View style={FRAME}>
      <AppShell
        testID="music-studio"
        drawer="overlay"
        drawerOpen={navOpen}
        onDrawerOpenChange={setNavOpen}
        sidebar={{
          logo: { icon: <StudioMark />, wordmark: 'Studio', onPress: () => setPage('dashboard') },
          items: NAV,
          secondaryItems: SECONDARY,
          selected: page,
          onNavigate: (item) => {
            if (item.key === 'dashboard' || item.key === 'releases' || item.key === 'new-release') setPage(item.key);
            setNavOpen(false);
          },
          account: { name: artist.name, avatar: { source: artist.photo } },
        }}
        title={title}
        actions={
          page === 'new-release' ? (
            <Button variant="secondary" size="small">
              Save draft
            </Button>
          ) : (
            <Button variant="primary" size="small" leadingIcon={RiAddFill} onPress={() => setPage('new-release')}>
              New release
            </Button>
          )
        }
      >
        {page === 'dashboard' ? <Dashboard /> : page === 'releases' ? <Releases /> : <NewRelease />}
      </AppShell>
    </View>
  );
}

function Section({
  title,
  children,
  trailing,
}: {
  title: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="headline-semibold" role="heading" style={{ flex: 1 }}>
          {title}
        </Text>
        {trailing}
      </View>
      {children}
    </View>
  );
}

/** Two columns from `from` px of window, stacked below. */
function Columns({
  children,
  from = 1180,
  ratio = [2, 1],
}: {
  children: [React.ReactNode, React.ReactNode];
  from?: number;
  ratio?: [number, number];
}) {
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
//  Dashboard
// ---------------------------------------------------------------------------

function Dashboard() {
  const [period, setPeriod] = useState('28d');
  return (
    <View style={{ gap: 24, paddingBottom: 32 }}>
      <AudienceOverview
        metrics={STUDIO_METRICS}
        period={period}
        onPeriodChange={setPeriod}
        caption="Compared with the previous 28 days"
      />
      <Columns>
        <StreamsChart metrics={STUDIO_STREAMS} events={STUDIO_EVENTS} />
        <PayoutSummaryCard
          estimated="$6,284.50"
          delta={0.227}
          lastPayout={{ amount: '$5,120.00', date: '28 Aug' }}
          nextPayoutDate="28 Sep 2026"
          months={STUDIO_PAYOUT_MONTHS}
          onViewStatements={() => {}}
        />
      </Columns>
      <TopTracksTable tracks={STUDIO_TOP_TRACKS} summary="Last 28 days" />
      <AudienceBreakdown {...STUDIO_BREAKDOWN} range="Last 28 days" />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Releases
// ---------------------------------------------------------------------------

const RELEASE_ACTIONS: ReleaseAction[] = [
  { label: 'View details', icon: RiEyeLine },
  { label: 'Edit metadata', icon: RiEditLine },
  { label: 'Duplicate', icon: RiFileCopyLine },
  { label: 'Delete', icon: RiDeleteBinLine, destructive: true },
];

const RELEASE_FILTERS: { value: string; label: string; statuses: readonly ReleaseStatus[] }[] = [
  { value: 'all', label: 'All', statuses: ['draft', 'in-review', 'scheduled', 'live', 'rejected', 'takedown'] },
  { value: 'live', label: 'Live', statuses: ['live'] },
  { value: 'upcoming', label: 'Upcoming', statuses: ['in-review', 'scheduled'] },
  { value: 'attention', label: 'Needs attention', statuses: ['draft', 'rejected'] },
];

function Releases() {
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState('all');
  const [layout, setLayout] = useState<'grid' | 'row'>('grid');
  const statuses = RELEASE_FILTERS.find((f) => f.value === filter)!.statuses;
  const shown = STUDIO_RELEASES.filter((r) => statuses.includes(r.status));
  const columns = width >= 1280 ? 4 : width >= 900 ? 3 : 2;
  const rows: (typeof STUDIO_RELEASES)[] = [];
  for (let i = 0; i < shown.length; i += columns) rows.push(shown.slice(i, i + columns));

  return (
    <View style={{ gap: 20, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <FilterChips
          accessibilityLabel="Release status"
          value={filter}
          onValueChange={(v) => setFilter(v ?? 'all')}
          options={RELEASE_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
          style={{ flexShrink: 1 }}
        />
        <View style={{ flex: 1 }} />
        <SegmentedControl
          label="Layout"
          type="radio"
          value={layout}
          onChange={(v: string) => setLayout(v as 'grid' | 'row')}
        >
          <SegmentedControlItem value="grid">
            <SegmentedControlItemText>Grid</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="row">
            <SegmentedControlItemText>List</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
      </View>
      {layout === 'grid' ? (
        <View style={{ gap: 16 }}>
          {rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              {row.map((release) => (
                <View key={release.id} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
                  <ReleaseCard release={release} onPress={() => {}} actions={RELEASE_ACTIONS} />
                </View>
              ))}
              {Array.from({ length: columns - row.length }, (_, i) => (
                <View key={`e${i}`} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }} />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {shown.map((release) => (
            <ReleaseCard key={release.id} release={release} layout="row" onPress={() => {}} actions={RELEASE_ACTIONS} />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  New release
// ---------------------------------------------------------------------------

const INITIAL_METADATA: TrackMetadata = {
  title: 'Winter Ferry',
  version: '',
  explicit: false,
  genre: 'synth-pop',
  primaryArtists: ['Lumen Vale'],
  featuredArtists: ['Odessa Rowe'],
  isrc: 'QZ-K6P-26-00412',
  language: 'english',
  lyrics: 'Streetlights hum a quiet tune\nPaper lanterns chase the moon',
  credits: [],
};

const INITIAL_CREDITS: TrackCredit[] = [
  { id: 'c1', role: 'songwriter', name: 'Lumen Vale' },
  { id: 'c2', role: 'producer', name: 'Teodor Brask' },
  { id: 'c3', role: 'mixing-engineer', name: 'Ada Moss' },
];

interface UploadRow {
  id: string;
  fileName: string;
  size: number;
  status: TrackUploadStatus;
  progress?: number;
  duration?: string;
  error?: string;
}

const INITIAL_UPLOADS: UploadRow[] = [
  { id: 'u1', fileName: '01 Winter Ferry.wav', size: 48_200_000, status: 'ready', duration: '3:52' },
  { id: 'u2', fileName: '02 Harbour at Six.wav', size: 52_900_000, status: 'processing' },
  { id: 'u3', fileName: '03 Soft Static (Reprise).wav', size: 31_400_000, status: 'uploading', progress: 38 },
  {
    id: 'u4',
    fileName: '04 Lamp Oil.flac',
    size: 29_100_000,
    status: 'failed',
    error: 'The upload was interrupted. Check your connection and retry.',
  },
];

function NewRelease() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [uploads, setUploads] = useState<UploadRow[]>(INITIAL_UPLOADS);
  const [metadata, setMetadata] = useState<TrackMetadata>(INITIAL_METADATA);
  const [credits, setCredits] = useState<TrackCredit[]>(INITIAL_CREDITS);
  const [artwork, setArtwork] = useState<string | null>(null);
  const [release, setRelease] = useState<string | undefined>('winter-ferry');
  const [moods, setMoods] = useState<string[]>(['Nocturnal']);
  const [genres, setGenres] = useState<string[]>(['Synth-pop']);
  const [pitch, setPitch] = useState(
    'Four songs written on the last ferry of the winter timetable — slow synths, a choir of harbour sirens, and the quietest vocal we have ever recorded.',
  );
  const [pitchStatus, setPitchStatus] = useState<PitchStatus>('draft');

  // A fake upload: the uploading row climbs, then transcodes, then is ready.
  useEffect(() => {
    const timer = setInterval(() => {
      setUploads((rows) =>
        rows.map((row) => {
          if (row.status === 'uploading') {
            const progress = (row.progress ?? 0) + 4;
            return progress >= 100 ? { ...row, status: 'processing', progress: 100 } : { ...row, progress };
          }
          return row;
        }),
      );
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ gap: 24, paddingBottom: 32 }}>
      <View
        style={{
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 16,
          paddingTop: 20,
          paddingBottom: 16,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <ReleaseTimeline steps={STUDIO_STEPS} orientation={width >= 900 ? 'horizontal' : 'vertical'} />
      </View>

      <Columns from={1100} ratio={[3, 2]}>
        <View style={{ gap: 24 }}>
          <Section
            title="Tracks"
            trailing={
              <Text
                variant="caption-1-regular"
                style={{ color: theme.colors.textSecondary }}
              >{`${uploads.length} files`}</Text>
            }
          >
            <FileUpload
              allowedExtensions={['wav', 'flac', 'aiff', 'mp3']}
              maxBytes={500 * 1024 * 1024}
              labels={{ prompt: 'Drop audio files here or' }}
              accessibilityLabel="Upload audio"
              onFileSelected={(file) =>
                setUploads((rows) => [
                  ...rows,
                  { id: `u${rows.length + 1}`, fileName: file.name, size: file.size, status: 'uploading', progress: 0 },
                ])
              }
            />
            <View style={{ gap: 8 }}>
              {uploads.map((row) => (
                <TrackUploadRow
                  key={row.id}
                  fileName={row.fileName}
                  size={row.size}
                  status={row.status}
                  progress={row.progress}
                  remaining={
                    row.status === 'uploading'
                      ? `About ${Math.max(1, Math.round((100 - (row.progress ?? 0)) / 10))} s left`
                      : undefined
                  }
                  duration={row.duration}
                  error={row.error}
                  onRetry={() =>
                    setUploads((rows) =>
                      rows.map((r) =>
                        r.id === row.id ? { ...r, status: 'uploading', progress: 0, error: undefined } : r,
                      ),
                    )
                  }
                  onRemove={() => setUploads((rows) => rows.filter((r) => r.id !== row.id))}
                />
              ))}
            </View>
          </Section>
          <Section title="Track details">
            <TrackMetadataForm
              value={metadata}
              onChange={setMetadata}
              genres={STUDIO_GENRES}
              languages={STUDIO_LANGUAGES}
              showCredits={false}
            />
          </Section>
          <Section title="Credits">
            <CreditsEditor credits={credits} onCreditsChange={setCredits} />
          </Section>
        </View>
        <View style={{ gap: 24 }}>
          <Section title="Artwork">
            <ArtworkUploader
              artwork={artwork}
              onFileSelected={() => setArtwork(ALBUM_BY_ID['blue-hour-ep']!.artwork)}
              onRemove={() => setArtwork(null)}
              onPickFiles={() => ({ name: 'winter-ferry-cover.png', size: 4_200_000 })}
            />
            {artwork ? null : (
              <Button
                variant="secondary"
                size="small"
                style={{ alignSelf: 'flex-start' }}
                onPress={() => setArtwork(ALBUM_BY_ID['blue-hour-ep']!.artwork)}
              >
                Use the draft cover
              </Button>
            )}
          </Section>
          <PitchCard
            releases={[
              { value: 'winter-ferry', label: 'Winter Ferry · EP · 20 Nov' },
              { value: 'tramlines', label: 'Tramlines · Single · 9 Oct' },
            ]}
            release={release}
            onReleaseChange={setRelease}
            moods={STUDIO_MOODS}
            selectedMoods={moods}
            onSelectedMoodsChange={setMoods}
            genres={STUDIO_PITCH_GENRES}
            selectedGenres={genres}
            onSelectedGenresChange={setGenres}
            pitch={pitch}
            onPitchChange={setPitch}
            status={pitchStatus}
            submittedAt="Sent 17 Sep"
            onSubmit={() => {
              setPitchStatus('submitting');
              setTimeout(() => setPitchStatus('submitted'), 900);
            }}
            onEdit={() => setPitchStatus('draft')}
          />
        </View>
      </Columns>
    </View>
  );
}
