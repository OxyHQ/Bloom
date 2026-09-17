import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { FileUploadFile } from '../file-upload/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** A Remix-style icon component: `width`, `height`, `fill`. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type CreatorStudioIcon = BloomIconComponent;

/** Which way a figure moved against the previous period. */
export type CreatorTrend = 'up' | 'down' | 'flat';

/** A `{ value, label }` choice — genres, languages, credit roles, releases. */
export interface CreatorOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
//  AudienceOverview
// ---------------------------------------------------------------------------

export type AudienceMetricKind = 'listeners' | 'streams' | 'followers' | 'saves';

export interface AudienceMetric {
  /** Picks the default icon; also the React key. */
  kind: AudienceMetricKind;
  /** Visible label ("Listeners"). */
  label: string;
  /** Pre-formatted value (`"48,210"`). */
  value: string;
  /** Pre-formatted change against the previous period (`"+12.4%"`). */
  delta: string;
  /** Colours the delta chip and the sparkline. */
  trend: CreatorTrend;
  /** The period's values, oldest first, for the sparkline. None drawn when omitted. */
  series?: readonly number[];
  /** Overrides the kind's icon. */
  icon?: CreatorStudioIcon;
}

/** The overview's default periods. */
export type AudiencePeriod = '7d' | '28d' | '12m' | 'all';

export interface AudienceOverviewProps {
  /** The KPI tiles, in order — normally Listeners, Streams, Followers, Saves. */
  metrics: readonly AudienceMetric[];
  /** The selected period id. */
  period: string;
  onPeriodChange: (period: string) => void;
  /** Default: 7 days · 28 days · 12 months · All time. */
  periods?: readonly CreatorOption[];
  /** Heading over the tiles. Default `"Audience"`. */
  title?: string;
  /** A line under the heading (`"Compared with the previous 28 days"`). */
  caption?: string;
  /** Names the period switcher. Default `"Period"`. */
  periodLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  StreamsChart
// ---------------------------------------------------------------------------

export interface StreamsPoint {
  /** X label (`"12 Mar"`). */
  label: string;
  value: number;
}

/** One switchable metric of the chart. */
export interface StreamsMetric {
  id: string;
  /** Segment label and header label at rest ("Streams"). */
  label: string;
  data: readonly StreamsPoint[];
  /** Headline at rest; defaults to the sum of the points. */
  headline?: number;
  /** Delta ratio for the chip (`0.12` → `+12.0%`). */
  delta?: number;
}

/** A release (or any dated event) marked on the chart. */
export interface StreamsEvent {
  /** Index into the metric's `data`. */
  index: number;
  /** "Low Tide · Single". */
  label: string;
}

export interface StreamsChartProps {
  metrics: readonly StreamsMetric[];
  /** Controlled metric id. */
  metric?: string;
  defaultMetric?: string;
  onMetricChange?: (id: string) => void;
  /** Release markers: a dashed rule and a labelled pin. */
  events?: readonly StreamsEvent[];
  /** Names the metric switcher. Default `"Chart metric"`. */
  metricsLabel?: string;
  /** Headline format. Default en-US grouping. */
  format?: (value: number) => string;
  /** Y tick format. Default `4.5K`. */
  formatAxisValue?: (value: number) => string;
  /** Card height. Default 360. */
  height?: number;
  /** Names the plot. Defaults to a summary of the metric and its releases. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  TopTracksTable
// ---------------------------------------------------------------------------

export type TopTrackTrend = CreatorTrend | 'new';

export interface TopTrack {
  id: string;
  title: string;
  /** Second line under the title ("Low Tide · Single"). */
  subtitle?: string;
  /** Cover URL or an ImageResolver id. */
  artwork?: string;
  streams: number;
  listeners: number;
  saves: number;
  /** Rank movement against the previous period. */
  trend: TopTrackTrend;
}

export interface TopTracksTableLabels {
  title: string;
  rank: string;
  track: string;
  streams: string;
  listeners: string;
  saves: string;
  trend: string;
  /** The trend glyph's accessible name. */
  trends: Record<TopTrackTrend, string>;
  empty: string;
}

export interface TopTracksTableProps {
  /** Tracks in rank order (index 0 is #1). */
  tracks: readonly TopTrack[];
  /** Count line under the title (`"Last 28 days"`). */
  summary?: ReactNode;
  /** Formats every number. Default en-US grouping. */
  format?: (value: number) => string;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Trailing toolbar controls. */
  toolbar?: ReactNode;
  labels?: Partial<TopTracksTableLabels>;
  /** Names the table. Default the `title` label. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  AudienceBreakdown
// ---------------------------------------------------------------------------

export interface BreakdownDatum {
  label: string;
  value: number;
  /** Any colour; defaults to the chart palette by index. */
  color?: string;
}

export interface AudienceBreakdownLabels {
  locations: string;
  cities: string;
  countries: string;
  age: string;
  gender: string;
  sources: string;
  /** The column caption over the location values. */
  metric: string;
}

export interface AudienceBreakdownProps {
  /** Top cities, largest first. */
  cities: readonly BreakdownDatum[];
  /** Top countries, largest first. */
  countries: readonly BreakdownDatum[];
  /** Age groups, youngest first. */
  ages: readonly BreakdownDatum[];
  /** Gender split. */
  genders: readonly BreakdownDatum[];
  /** Where listening started — playlists, profile, search, other. */
  sources: readonly BreakdownDatum[];
  /** Static period pill on the chart cards (`"Last 28 days"`). */
  range?: string;
  /** Formats values. Default en-US grouping. */
  format?: (value: number) => string;
  labels?: Partial<AudienceBreakdownLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Releases
// ---------------------------------------------------------------------------

export type ReleaseType = 'single' | 'ep' | 'album';

export type ReleaseStatus = 'draft' | 'in-review' | 'scheduled' | 'live' | 'rejected' | 'takedown';

export interface CreatorRelease {
  id: string;
  title: string;
  /** Shown under the title. */
  artist?: string;
  type: ReleaseType;
  /** Pre-formatted (`"14 Mar 2026"`). */
  releaseDate: string;
  status: ReleaseStatus;
  /** Why it was rejected or taken down — shown under the meta line. */
  statusReason?: string;
  trackCount: number;
  /** Cover URL or an ImageResolver id. */
  artwork?: string;
}

export interface ReleaseStatusBadgeProps {
  status: ReleaseStatus;
  /** Overrides the status's default text. */
  label?: string;
  size?: 'small' | 'medium';
  testID?: string;
}

/** One entry of a release card's actions menu. */
export interface ReleaseAction {
  label: string;
  onPress?: () => void;
  icon?: CreatorStudioIcon;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ReleaseCardLabels {
  types: Record<ReleaseType, string>;
  statuses: Record<ReleaseStatus, string>;
  /** `n => "4 tracks"`. */
  tracks: (count: number) => string;
  /** `title => "More actions for <title>"`. */
  actions: (title: string) => string;
}

export interface ReleaseCardProps {
  release: CreatorRelease;
  /** `grid` — cover on top; `row` — a list row with the cover leading. Default `grid`. */
  layout?: 'grid' | 'row';
  /** Opens the release. The cover and text become one pressable, named by the title. */
  onPress?: () => void;
  /** The "⋯" menu. No button without entries. */
  actions?: readonly ReleaseAction[];
  labels?: Partial<ReleaseCardLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type ReleaseStepState = 'complete' | 'current' | 'upcoming' | 'error';

export interface ReleaseStep {
  id: string;
  /** "Artwork". */
  label: string;
  state: ReleaseStepState;
  /** Pre-formatted date (`"12 Mar"`) or any short note. */
  date?: string;
  /** A longer line under the label (a rejection reason, "Usually 2–3 days"). */
  description?: string;
}

export interface ReleaseTimelineProps {
  steps: readonly ReleaseStep[];
  /** `vertical` (default) or `horizontal` — a row of steps for a wide header. */
  orientation?: 'vertical' | 'horizontal';
  /** Names the list. Default `"Release progress"`. */
  accessibilityLabel?: string;
  /** Spoken state words. */
  stateLabels?: Partial<Record<ReleaseStepState, string>>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Upload
// ---------------------------------------------------------------------------

export type TrackUploadStatus = 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';

export interface TrackUploadRowLabels {
  queued: string;
  /** Status text while transcoding. Default `"Transcoding…"`. */
  processing: string;
  ready: string;
  failed: string;
  retry: string;
  /** `name => "Remove <name>"`. */
  remove: (fileName: string) => string;
  /** `name => "Uploading <name>"` — names the progress bar. */
  progress: (fileName: string) => string;
}

export interface TrackUploadRowProps {
  fileName: string;
  /** Bytes (formatted `12.4 MB`) or a pre-formatted string. */
  size: number | string;
  status: TrackUploadStatus;
  /** 0–100 while uploading. */
  progress?: number;
  /** Pre-formatted time left (`"About 20 s left"`). */
  remaining?: string;
  /** Pre-formatted duration shown once ready (`"3:42"`). */
  duration?: string;
  /** The failure message. Default the `failed` label. */
  error?: string;
  onRetry?: () => void;
  onRemove?: () => void;
  labels?: Partial<TrackUploadRowLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ArtworkUploaderLabels {
  /** Heading over the zone. Default `"Artwork"`. */
  title: string;
  /** Default `"3000×3000 px, JPG or PNG"`. */
  requirements: string;
  replace: string;
  remove: string;
  cancel: string;
  /** Names the preview image. */
  preview: string;
  /** Names the drop zone. */
  upload: string;
}

export interface ArtworkUploaderProps {
  /** The current cover (URL or ImageResolver id). `null`/omitted shows the drop zone. */
  artwork?: string | null;
  /** A picked file that passed the type and size checks. */
  onFileSelected?: (file: FileUploadFile) => void;
  /** Removes the current cover. */
  onRemove?: () => void;
  /** Native picker (required on native — see `FileUpload`). */
  onPickFiles?: () =>
    | Promise<FileUploadFile | readonly FileUploadFile[] | null | undefined>
    | FileUploadFile
    | readonly FileUploadFile[]
    | null
    | undefined;
  /** Validation message (`artworkDimensionsError` builds the "too small" one). */
  error?: string | null;
  /** Upload progress of the picked file, 0–100 (see `FileUpload#progress`). */
  progress?: number;
  /** The file uploading (see `FileUpload#file`). */
  file?: FileUploadFile | null;
  /** Default jpg, jpeg, png. */
  allowedExtensions?: readonly string[];
  /** Default 20 MB. */
  maxBytes?: number;
  /** Side of the square. Default: the container's width, up to 320. */
  size?: number;
  disabled?: boolean;
  labels?: Partial<ArtworkUploaderLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Metadata
// ---------------------------------------------------------------------------

export interface TrackCredit {
  id: string;
  /** A `roles` value. */
  role: string;
  name: string;
}

export interface CreditsEditorLabels {
  title: string;
  role: string;
  name: string;
  add: string;
  /** `(index, name) => "Remove credit 2"`. */
  remove: (index: number, name: string) => string;
  empty: string;
}

export interface CreditsEditorProps {
  credits: readonly TrackCredit[];
  onCreditsChange: (credits: TrackCredit[]) => void;
  /** Default Songwriter, Producer, Composer, Performer, Lyricist, Mixing engineer, Mastering engineer. */
  roles?: readonly CreatorOption[];
  /** Builds a new credit's id. Default a counter. */
  createId?: () => string;
  disabled?: boolean;
  labels?: Partial<CreditsEditorLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ArtistChipsInputProps {
  label: string;
  values: readonly string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  /** Hint under the field. */
  hint?: string;
  /** Most names allowed; the input disables at the cap. */
  max?: number;
  /** `name => "Remove <name>"`. */
  removeLabel?: (name: string) => string;
  /** Default `"Add"`. */
  addLabel?: string;
  disabled?: boolean;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface IsrcFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  /** Default `"ISRC"`. */
  label?: string;
  /** Default `"Format: CC-XXX-YY-NNNNN"`. */
  hint?: string;
  /** Shown instead of the hint when the value is not a valid ISRC. Default `"That is not a valid ISRC"`. */
  invalidMessage?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TrackMetadata {
  title: string;
  version: string;
  explicit: boolean;
  genre?: string;
  primaryArtists: string[];
  featuredArtists: string[];
  isrc: string;
  language?: string;
  lyrics: string;
  credits: TrackCredit[];
}

export interface TrackMetadataFormLabels {
  title: string;
  version: string;
  versionPlaceholder: string;
  explicit: string;
  explicitDescription: string;
  genre: string;
  genrePlaceholder: string;
  primaryArtists: string;
  featuredArtists: string;
  artistPlaceholder: string;
  language: string;
  languagePlaceholder: string;
  lyrics: string;
  lyricsPlaceholder: string;
}

export interface TrackMetadataFormProps {
  value: TrackMetadata;
  onChange: (next: TrackMetadata) => void;
  genres: readonly CreatorOption[];
  languages: readonly CreatorOption[];
  /** Credit roles for the embedded `CreditsEditor`. */
  roles?: readonly CreatorOption[];
  /** Hide the embedded credits editor (render your own). Default `true`. */
  showCredits?: boolean;
  /** Per-field messages; a field with one paints invalid. */
  errors?: Partial<Record<'title' | 'version' | 'genre' | 'primaryArtists' | 'isrc' | 'language' | 'lyrics', string>>;
  disabled?: boolean;
  labels?: Partial<TrackMetadataFormLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Payouts and pitching
// ---------------------------------------------------------------------------

export interface PayoutMonth {
  label: string;
  value: number;
}

export interface PayoutSummaryCardLabels {
  estimated: string;
  lastPayout: string;
  nextPayout: string;
  statements: string;
  /** Names the monthly chart. */
  chart: string;
}

export interface PayoutSummaryCardProps {
  /** Pre-formatted estimate for this month (`"$1,284.50"`). */
  estimated: string;
  /** Delta ratio against last month for the chip. */
  delta?: number;
  /** Pre-formatted amount and date of the last payout. */
  lastPayout?: { amount: string; date: string };
  /** Pre-formatted date of the next payout. */
  nextPayoutDate?: string;
  /** Monthly earnings, oldest first; the last bar is the current month. */
  months: readonly PayoutMonth[];
  /** Formats a hovered bar's value. Default `$1,234`. */
  format?: (value: number) => string;
  onViewStatements?: () => void;
  /** Makes "View statements" a link. */
  statementsHref?: string;
  labels?: Partial<PayoutSummaryCardLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type PitchStatus = 'draft' | 'submitting' | 'submitted' | 'accepted' | 'declined';

export interface PitchCardLabels {
  title: string;
  description: string;
  release: string;
  releasePlaceholder: string;
  moods: string;
  genres: string;
  pitch: string;
  pitchPlaceholder: string;
  submit: string;
  /** `max => "Pick up to 3"`. */
  tagLimit: (max: number) => string;
  statuses: Record<Exclude<PitchStatus, 'draft' | 'submitting'>, string>;
  statusDescriptions: Record<Exclude<PitchStatus, 'draft' | 'submitting'>, string>;
  edit: string;
}

export interface PitchCardProps {
  /** Upcoming releases that can be pitched. */
  releases: readonly CreatorOption[];
  release?: string;
  onReleaseChange: (value: string) => void;
  moods: readonly string[];
  selectedMoods: readonly string[];
  onSelectedMoodsChange: (moods: string[]) => void;
  genres: readonly string[];
  selectedGenres: readonly string[];
  onSelectedGenresChange: (genres: string[]) => void;
  pitch: string;
  onPitchChange: (value: string) => void;
  /** Character cap of the pitch. Default 500. */
  maxLength?: number;
  /** Most tags per group. Default 3. */
  maxTags?: number;
  /** Default `'draft'`. */
  status?: PitchStatus;
  /** Pre-formatted, shown with a sent status (`"Sent 2 Mar"`). */
  submittedAt?: string;
  onSubmit?: () => void;
  /** Returns a sent pitch to editing (only offered while `submitted`). */
  onEdit?: () => void;
  labels?: Partial<PitchCardLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
