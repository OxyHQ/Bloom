import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type {
  ArtworkUploaderLabels,
  AudienceBreakdownLabels,
  AudiencePeriod,
  CreditsEditorLabels,
  PayoutSummaryCardLabels,
  PitchCardLabels,
  ReleaseStatus,
  ReleaseStepState,
  ReleaseType,
  TopTracksTableLabels,
  TrackMetadataFormLabels,
  TrackUploadRowLabels,
} from './types';

/** The built-in credit roles (`DEFAULT_CREDIT_ROLES`). */
export type CreatorCreditRole =
  | 'songwriter'
  | 'producer'
  | 'composer'
  | 'performer'
  | 'lyricist'
  | 'mixing-engineer'
  | 'mastering-engineer';

/**
 * Every fixed string the creator-studio family draws or announces, in each
 * Bloom language. Numbers, dates and money arrive pre-formatted from the app;
 * a caller's `labels` (or `*Label`) prop still wins over any entry here. The
 * common words (Cancel, Retry, More actions) come from `COMMON_MESSAGES`.
 */
export interface CreatorStudioMessages {
  releaseTypes: Record<ReleaseType, string>;
  releaseStatuses: Record<ReleaseStatus, string>;
  creditRoles: Record<CreatorCreditRole, string>;
  /** `AudienceOverview`'s default periods. */
  periods: Record<AudiencePeriod, string>;
  /** `artworkDimensionsError`. */
  artworkNotSquare: (width: number, height: number) => string;
  artworkTooSmall: (width: number, height: number, minSize: number) => string;
  audience: { title: string; period: string };
  breakdown: AudienceBreakdownLabels;
  /** `StreamsChart`: the switcher's name, and the plot's name — `releases` is `''` when none are marked. */
  streams: { metrics: string; summary: (metric: string, releases: string) => string };
  /** `rankName` names the "#" column; `newBadge` is the trend cell's "New". */
  topTracks: TopTracksTableLabels & { rankName: string; newBadge: string };
  /** `ReleaseCard`'s track count. */
  tracks: (count: number) => string;
  timeline: { states: Record<ReleaseStepState, string>; label: string };
  upload: Omit<TrackUploadRowLabels, 'retry'>;
  artwork: Omit<ArtworkUploaderLabels, 'cancel'>;
  /** `field` names a row's role or name input: `(field, n) => "Role, credit 2"`. */
  credits: CreditsEditorLabels & { field: (field: string, n: number) => string };
  /** `ArtistChipsInput`: the button, its name for a field (`"Add primary artists"`), a chip's remove. */
  artists: { add: string; addTo: (label: string) => string; remove: (name: string) => string };
  isrc: { hint: string; invalid: string };
  metadata: TrackMetadataFormLabels;
  payout: PayoutSummaryCardLabels;
  pitch: PitchCardLabels;
}

export const CREATOR_STUDIO_MESSAGES: MessageCatalog<CreatorStudioMessages> =
  defineMessages<CreatorStudioMessages>('CREATOR_STUDIO_MESSAGES', {
    releaseTypes: { single: 'Single', ep: 'EP', album: 'Album' },
    releaseStatuses: {
      draft: 'Draft',
      'in-review': 'In review',
      scheduled: 'Scheduled',
      live: 'Live',
      rejected: 'Rejected',
      takedown: 'Taken down',
    },
    creditRoles: {
      songwriter: 'Songwriter',
      producer: 'Producer',
      composer: 'Composer',
      performer: 'Performer',
      lyricist: 'Lyricist',
      'mixing-engineer': 'Mixing engineer',
      'mastering-engineer': 'Mastering engineer',
    },
    periods: { '7d': '7 days', '28d': '28 days', '12m': '12 months', all: 'All time' },
    artworkNotSquare: (w, h) => `Artwork must be square — this image is ${w}×${h} px.`,
    artworkTooSmall: (w, h, min) =>
      `Artwork is too small (${w}×${h} px). Upload at least ${min}×${min} px.`,
    audience: { title: 'Audience', period: 'Period' },
    breakdown: {
      locations: 'Top locations',
      cities: 'Cities',
      countries: 'Countries',
      age: 'Age',
      gender: 'Gender',
      sources: 'Listening sources',
      metric: 'Listeners',
    },
    streams: {
      metrics: 'Chart metric',
      summary: (metric, releases) =>
        releases ? `${metric} over time; releases: ${releases}` : `${metric} over time`,
    },
    topTracks: {
      title: 'Top tracks',
      rank: '#',
      rankName: 'Rank',
      track: 'Track',
      streams: 'Streams',
      listeners: 'Listeners',
      saves: 'Saves',
      trend: 'Trend',
      trends: { up: 'Rising', down: 'Falling', flat: 'Steady', new: 'New entry' },
      newBadge: 'New',
      empty: 'No streams in this period yet.',
    },
    tracks: (n) => plural('en', n, { one: '{n} track', other: '{n} tracks' }),
    timeline: {
      states: {
        complete: 'complete',
        current: 'in progress',
        upcoming: 'not started',
        error: 'needs attention',
      },
      label: 'Release progress',
    },
    upload: {
      queued: 'Queued',
      processing: 'Transcoding…',
      ready: 'Ready',
      failed: 'Upload failed',
      remove: (name) => `Remove ${name}`,
      progress: (name) => `Uploading ${name}`,
    },
    artwork: {
      title: 'Artwork',
      requirements: '3000×3000 px, JPG or PNG',
      replace: 'Replace',
      remove: 'Remove artwork',
      preview: 'Release artwork',
      upload: 'Upload artwork',
    },
    credits: {
      title: 'Credits',
      role: 'Role',
      name: 'Name',
      add: 'Add credit',
      remove: (index, name) =>
        name ? `Remove credit ${index + 1}, ${name}` : `Remove credit ${index + 1}`,
      empty: 'Credit the songwriters, producers and performers on this track.',
      field: (field, n) => `${field}, credit ${n}`,
    },
    artists: {
      add: 'Add',
      addTo: (label) => `Add ${String(label).toLowerCase()}`,
      remove: (name) => `Remove ${name}`,
    },
    isrc: { hint: 'Format: CC-XXX-YY-NNNNN', invalid: 'That is not a valid ISRC' },
    metadata: {
      title: 'Track title',
      version: 'Version',
      versionPlaceholder: 'Remix, Live, Acoustic…',
      explicit: 'Explicit lyrics',
      explicitDescription: 'Mark the track if it contains strong language or explicit themes.',
      genre: 'Genre',
      genrePlaceholder: 'Choose a genre',
      primaryArtists: 'Primary artists',
      featuredArtists: 'Featured artists',
      artistPlaceholder: 'Add an artist name',
      language: 'Lyrics language',
      languagePlaceholder: 'Choose a language',
      lyrics: 'Lyrics',
      lyricsPlaceholder: 'Paste the lyrics, one line per sung line',
    },
    payout: {
      estimated: 'Estimated earnings this month',
      lastPayout: 'Last payout',
      nextPayout: 'Next payout',
      statements: 'View statements',
      chart: 'Monthly earnings',
    },
    pitch: {
      title: 'Pitch to editors',
      description: 'Tell the editorial team about your next release before it comes out.',
      release: 'Release',
      releasePlaceholder: 'Choose an upcoming release',
      moods: 'Mood',
      genres: 'Genre',
      pitch: 'Your pitch',
      pitchPlaceholder:
        'What makes this release stand out? Who is it for, and what is the story behind it?',
      submit: 'Send pitch',
      tagLimit: (max) => `Pick up to ${max}`,
      statuses: {
        submitted: 'Pitch sent',
        accepted: 'Picked for review',
        declined: 'Not selected this time',
      },
      statusDescriptions: {
        submitted: 'Editors read every pitch. You will hear back before the release date.',
        accepted: 'Your release is being considered for editorial playlists.',
        declined:
          'This release was not picked. You can pitch your next one as soon as it is scheduled.',
      },
      edit: 'Edit pitch',
    },
  });
