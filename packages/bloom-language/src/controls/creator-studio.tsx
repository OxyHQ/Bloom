import {
  ArtistChipsInput as BloomArtistChipsInput,
  type ArtistChipsInputProps,
  ArtworkUploader as BloomArtworkUploader,
  type ArtworkUploaderProps,
  type AudienceBreakdownProps,
  AudienceBreakdown as BloomAudienceBreakdown,
  type AudienceMetric,
  AudienceOverview as BloomAudienceOverview,
  type AudienceOverviewProps,
  type CreatorRelease,
  CreditsEditor as BloomCreditsEditor,
  type CreditsEditorProps,
  IsrcField as BloomIsrcField,
  type IsrcFieldProps,
  PayoutSummaryCard as BloomPayoutSummaryCard,
  type PayoutSummaryCardProps,
  PitchCard as BloomPitchCard,
  type PitchCardProps,
  ReleaseCard as BloomReleaseCard,
  type ReleaseCardProps,
  type ReleaseStatus,
  ReleaseStatusBadge as BloomReleaseStatusBadge,
  type ReleaseStatusBadgeProps,
  type ReleaseStep,
  ReleaseTimeline as BloomReleaseTimeline,
  type ReleaseTimelineProps,
  type StreamsMetric,
  StreamsChart as BloomStreamsChart,
  type StreamsChartProps,
  type TopTrack,
  TopTracksTable as BloomTopTracksTable,
  type TopTracksTableProps,
  type TrackCredit,
  type TrackMetadata,
  TrackMetadataForm as BloomTrackMetadataForm,
  type TrackMetadataFormProps,
  type TrackUploadStatus,
  TrackUploadRow as BloomTrackUploadRow,
  type TrackUploadRowProps,
} from '@oxy.so/bloom/creator-studio';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { Axis, ReleaseCardLayout, ReleaseStatusBadgeSize, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** The artist and podcaster portal: audience, releases, uploads, metadata, payouts and pitching. */
export type CreatorStudioKind =
  | 'audienceOverview'
  | 'streamsChart'
  | 'topTracksTable'
  | 'audienceBreakdown'
  | 'releaseCard'
  | 'releaseStatusBadge'
  | 'releaseTimeline'
  | 'trackUploadRow'
  | 'trackMetadataForm'
  | 'artistChipsInput'
  | 'isrcField'
  | 'creditsEditor'
  | 'artworkUploader'
  | 'payoutSummaryCard'
  | 'pitchCard';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type AudienceOverviewOptions = Omit<
  AudienceOverviewProps,
  Drawn | 'metrics' | 'period' | 'onPeriodChange'
>;
/** Its height a space token, where Bloom takes a number. */
export type StreamsChartOptions = Omit<StreamsChartProps, Drawn | 'metrics' | 'height'> & {
  readonly height?: SpaceToken;
};
export type TopTracksTableOptions = Omit<
  TopTracksTableProps,
  Drawn | 'tracks' | 'summary' | 'toolbar'
> & { readonly summary?: Child; readonly toolbar?: Child };
export type AudienceBreakdownOptions = Omit<AudienceBreakdownProps, Drawn>;
export type ReleaseCardOptions = Omit<ReleaseCardProps, Drawn | 'release' | 'layout' | 'onPress'>;
export type ReleaseStatusBadgeOptions = Omit<ReleaseStatusBadgeProps, Drawn | 'status' | 'size'>;
export type ReleaseTimelineOptions = Omit<ReleaseTimelineProps, Drawn | 'steps' | 'orientation'>;
export type TrackUploadRowOptions = Omit<TrackUploadRowProps, Drawn | 'fileName' | 'status'>;
export type TrackMetadataFormOptions = Omit<
  TrackMetadataFormProps,
  Drawn | 'value' | 'onChange' | 'disabled'
>;
export type ArtistChipsInputOptions = Omit<
  ArtistChipsInputProps,
  Drawn | 'label' | 'values' | 'onValuesChange' | 'disabled'
>;
export type IsrcFieldOptions = Omit<IsrcFieldProps, Drawn | 'value' | 'onChangeText' | 'disabled'>;
export type CreditsEditorOptions = Omit<
  CreditsEditorProps,
  Drawn | 'credits' | 'onCreditsChange' | 'disabled'
>;
/** Its side a space token, where Bloom takes a number. */
export type ArtworkUploaderOptions = Omit<
  ArtworkUploaderProps,
  Drawn | 'artwork' | 'size' | 'disabled'
> & { readonly size?: SpaceToken };
export type PayoutSummaryCardOptions = Omit<PayoutSummaryCardProps, Drawn | 'estimated'>;
/** Bloom `PitchCard`'s data, as the app controls it (its release, tags, pitch and status). */
export type PitchCardOptions = Omit<PitchCardProps, Drawn>;

export type AudienceOverviewView = ViewModifiers<AudienceOverviewView>;
/** Bloom `StreamsChart`; `.label()` names its plot. */
export type StreamsChartView = ViewModifiers<StreamsChartView>;
/** Bloom `TopTracksTable`; `.label()` names the table. */
export type TopTracksTableView = ViewModifiers<TopTracksTableView>;
export type AudienceBreakdownView = ViewModifiers<AudienceBreakdownView>;
/** Bloom `ReleaseCard`; `.onPress()` opens the release. */
export interface ReleaseCardView extends ViewModifiers<ReleaseCardView> {
  /** `grid` (default: the cover on top) or `row` (a list row, the cover leading). */
  style(value: ReleaseCardLayout): ReleaseCardView;
}
export interface ReleaseStatusBadgeView extends ViewModifiers<ReleaseStatusBadgeView> {
  /** `sm` or `md`. */
  size(value: ReleaseStatusBadgeSize): ReleaseStatusBadgeView;
}
/** Bloom `ReleaseTimeline`; `.label()` names the list. */
export interface ReleaseTimelineView extends ViewModifiers<ReleaseTimelineView> {
  /** `vertical` (default) or `horizontal`, a row of steps for a wide header. */
  axis(value: Axis): ReleaseTimelineView;
}
export type TrackUploadRowView = ViewModifiers<TrackUploadRowView>;
export interface TrackMetadataFormView extends ViewModifiers<TrackMetadataFormView> {
  disabled(value?: boolean): TrackMetadataFormView;
}
export interface ArtistChipsInputView extends ViewModifiers<ArtistChipsInputView> {
  disabled(value?: boolean): ArtistChipsInputView;
}
export interface IsrcFieldView extends ViewModifiers<IsrcFieldView> {
  disabled(value?: boolean): IsrcFieldView;
}
export interface CreditsEditorView extends ViewModifiers<CreditsEditorView> {
  disabled(value?: boolean): CreditsEditorView;
}
export interface ArtworkUploaderView extends ViewModifiers<ArtworkUploaderView> {
  disabled(value?: boolean): ArtworkUploaderView;
}
export type PayoutSummaryCardView = ViewModifiers<PayoutSummaryCardView>;
export type PitchCardView = ViewModifiers<PitchCardView>;

/** Bloom `AudienceOverview` of `metrics`, the selected period as its binding holds. */
export function AudienceOverview(
  metrics: readonly AudienceMetric[],
  period: Binding<string>,
  options: AudienceOverviewOptions = {},
): AudienceOverviewView {
  return new Node('audienceOverview', { metrics, binding: period, options }, []);
}
/** Bloom `StreamsChart` of `metrics`. */
export function StreamsChart(
  metrics: readonly StreamsMetric[],
  options: StreamsChartOptions = {},
): StreamsChartView {
  return new Node('streamsChart', { metrics, options }, []);
}
/** Bloom `TopTracksTable` of `tracks`, in rank order. */
export function TopTracksTable(
  tracks: readonly TopTrack[],
  options: TopTracksTableOptions = {},
): TopTracksTableView {
  return new Node('topTracksTable', { tracks, options }, []);
}
/** Bloom `AudienceBreakdown` of its cities, countries, ages, genders and sources. */
export function AudienceBreakdown(options: AudienceBreakdownOptions): AudienceBreakdownView {
  return new Node('audienceBreakdown', { options }, []);
}
/** Bloom `ReleaseCard` of `release`. */
export function ReleaseCard(
  release: CreatorRelease,
  options: ReleaseCardOptions = {},
): ReleaseCardView {
  return new Node('releaseCard', { release, options }, []);
}
/** Bloom `ReleaseStatusBadge` of `status`. */
export function ReleaseStatusBadge(
  status: ReleaseStatus,
  options: ReleaseStatusBadgeOptions = {},
): ReleaseStatusBadgeView {
  return new Node('releaseStatusBadge', { status, options }, []);
}
/** Bloom `ReleaseTimeline` of `steps`. */
export function ReleaseTimeline(
  steps: readonly ReleaseStep[],
  options: ReleaseTimelineOptions = {},
): ReleaseTimelineView {
  return new Node('releaseTimeline', { steps, options }, []);
}
/** Bloom `TrackUploadRow` of `fileName` at `status` (its `size` in the options). */
export function TrackUploadRow(
  fileName: string,
  status: TrackUploadStatus,
  options: TrackUploadRowOptions,
): TrackUploadRowView {
  return new Node('trackUploadRow', { fileName, status, options }, []);
}
/** Bloom `TrackMetadataForm`: edits the metadata its binding holds. */
export function TrackMetadataForm(
  value: Binding<TrackMetadata>,
  options: TrackMetadataFormOptions,
): TrackMetadataFormView {
  return new Node('trackMetadataForm', { binding: value, options }, []);
}
/** Bloom `ArtistChipsInput` labelled `label`: the names its binding holds. */
export function ArtistChipsInput(
  label: string,
  values: Binding<string[]>,
  options: ArtistChipsInputOptions = {},
): ArtistChipsInputView {
  return new Node('artistChipsInput', { label, binding: values, options }, []);
}
/** Bloom `IsrcField`: the code its binding holds. */
export function IsrcField(value: Binding<string>, options: IsrcFieldOptions = {}): IsrcFieldView {
  return new Node('isrcField', { binding: value, options }, []);
}
/** Bloom `CreditsEditor`: the credits its binding holds. */
export function CreditsEditor(
  credits: Binding<TrackCredit[]>,
  options: CreditsEditorOptions = {},
): CreditsEditorView {
  return new Node('creditsEditor', { binding: credits, options }, []);
}
/** Bloom `ArtworkUploader` of the current cover (`null` or none: the drop zone). */
export function ArtworkUploader(
  artwork: string | null | undefined,
  options: ArtworkUploaderOptions = {},
): ArtworkUploaderView {
  return new Node('artworkUploader', { artwork, options }, []);
}
/** Bloom `PayoutSummaryCard` of this month's `estimated` earnings. */
export function PayoutSummaryCard(
  estimated: string,
  options: PayoutSummaryCardOptions,
): PayoutSummaryCardView {
  return new Node('payoutSummaryCard', { estimated, options }, []);
}
/** Bloom `PitchCard`, controlled by the app as Bloom's is. */
export function PitchCard(options: PitchCardOptions): PitchCardView {
  return new Node('pitchCard', { options }, []);
}

/** `.disabled()`, which Bloom takes as its own prop. */
const disabled = (d: ControlDraw) => ({ disabled: d.own('disabled')?.value });

export const CREATOR_STUDIO: Record<CreatorStudioKind, ControlRenderer> = {
  audienceOverview: product(BloomAudienceOverview, { binding: ['period', 'onPeriodChange'] }),
  streamsChart: product(BloomStreamsChart, { lengths: ['height'] }),
  topTracksTable: product(BloomTopTracksTable, { slots: ['summary', 'toolbar'] }),
  audienceBreakdown: product(BloomAudienceBreakdown),
  releaseCard: product(BloomReleaseCard, {
    press: true,
    own: (d) => ({ layout: d.own('style')?.value }),
  }),
  releaseStatusBadge: product(BloomReleaseStatusBadge, {
    own: (d) => ({ size: d.own('size')?.value }),
  }),
  releaseTimeline: product(BloomReleaseTimeline, {
    own: (d) => ({ orientation: d.own('axis')?.value }),
  }),
  trackUploadRow: product(BloomTrackUploadRow),
  trackMetadataForm: product(BloomTrackMetadataForm, {
    binding: ['value', 'onChange'],
    own: disabled,
  }),
  artistChipsInput: product(BloomArtistChipsInput, {
    binding: ['values', 'onValuesChange'],
    own: disabled,
  }),
  isrcField: product(BloomIsrcField, { binding: ['value', 'onChangeText'], own: disabled }),
  creditsEditor: product(BloomCreditsEditor, {
    binding: ['credits', 'onCreditsChange'],
    own: disabled,
  }),
  artworkUploader: product(BloomArtworkUploader, { lengths: ['size'], own: disabled }),
  payoutSummaryCard: product(BloomPayoutSummaryCard),
  pitchCard: product(BloomPitchCard),
};
