import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomTone } from '../appearance';
import type { BloomIconComponent } from '../icons/icon-component';
import type { WebAriaProps } from '../styles/styled-primitives';

/** A URL, or an id the registered ImageResolver turns into one. */
export type MediaImageSource = string;

/** A person or artist named in a header's meta line. */
export interface MediaHeaderPerson {
  name: string;
  /** Round 24 avatar beside the name. Only the first three people draw one. */
  avatar?: MediaImageSource;
  /** Makes the name a link. */
  onPress?: () => void;
}

interface HeaderBase {
  /**
   * The artwork's dominant colour (hex or rgb, from the backend). The band is
   * tinted from it and clamped so the text on it always reads; absent or
   * unparsable, the band is neutral.
   */
  artworkColor?: string | null;
  /** Rendered under the header, on the band's fade to the page — normally a `MediaActionBar`. */
  actions?: ReactNode;
  /** Heading level of the title. Default `1`. */
  headingLevel?: 1 | 2 | 3;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `default` draws the cover image; `liked` the accent gradient with a heart and an accent band. */
export type CollectionHeaderVariant = 'default' | 'liked';

export interface CollectionHeaderProps extends HeaderBase {
  /** "Album", "Single", "EP", "Public playlist", "Audiobook"… */
  typeLabel: string;
  title: string;
  /** A playlist's description, under the title. Two lines. */
  description?: string;
  /** The cover image. Without one a neutral placeholder is drawn. */
  cover?: MediaImageSource;
  /** Default `default`. */
  variant?: CollectionHeaderVariant;
  /** Owner(s) or artist(s): avatars and names at the start of the meta line. */
  owners?: readonly MediaHeaderPerson[];
  /** "2024". */
  year?: string;
  /** "12 songs, 48 min". */
  summary?: string;
  /** "1,204 saves". */
  saves?: string;
  /** Shows an edit affordance on the cover and makes the title press to `onEdit`. */
  editable?: boolean;
  onEdit?: () => void;
  /** Name of the edit affordance. Default `"Edit details"`. */
  editLabel?: string;
}

// ---------------------------------------------------------------------------
//  Action bar
// ---------------------------------------------------------------------------

export type DownloadState = 'idle' | 'downloading' | 'downloaded';

export type MediaViewMode = 'list' | 'compact';

export interface MediaActionBarProps {
  playing: boolean;
  onPlayPress?: () => void;
  /** Appended to the play button's name: "Play Night Drive". */
  playSubject?: string;
  playDisabled?: boolean;

  /** Draws the shuffle toggle when `onShuffleChange` is given. */
  shuffle?: boolean;
  onShuffleChange?: (shuffle: boolean) => void;

  /** Draws the heart when `onLikedChange` is given. */
  liked?: boolean;
  onLikedChange?: (liked: boolean) => void;

  /** Draws the outline pill when `onFollowChange` is given ("Follow"/"Following", "Save"/"Saved"). */
  following?: boolean;
  onFollowChange?: (following: boolean) => void;
  /** Default `"Follow"`. Also the pill's accessible name, in both states. */
  followLabel?: string;
  /** Default `"Following"`. */
  followingLabel?: string;

  /** Draws the download toggle when `onDownloadPress` is given. Default `idle`. */
  download?: DownloadState;
  /** `0..1` while `downloading`. */
  downloadProgress?: number;
  onDownloadPress?: () => void;

  /** Draws the "More options" button. */
  onMorePress?: () => void;
  /** Replaces the more button — e.g. a `DropdownMenu` with a `MediaMoreButton` trigger. */
  more?: ReactNode;

  /** Right side: a search button when given. */
  onSearchPress?: () => void;
  /** Default `"Search in playlist"`. */
  searchLabel?: string;
  /** Right side: a list / compact view toggle when `onViewChange` is given. */
  view?: MediaViewMode;
  onViewChange?: (view: MediaViewMode) => void;
  /** The view toggle's name; `aria-pressed` is `true` in compact view. Default `"Compact view"`. */
  compactViewLabel?: string;
  /** Extra controls at the far right. */
  trailing?: ReactNode;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface ToggleBase {
  disabled?: boolean;
  /** Forwarded, so the control can be a menu trigger under `asChild`. */
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ShuffleButtonProps extends ToggleBase {
  shuffle: boolean;
  onShuffleChange: (shuffle: boolean) => void;
  /** Glyph size. Default `28`. */
  size?: number;
  /** Fixed name; `aria-pressed` carries the state. Default `"Shuffle"`. */
  accessibilityLabel?: string;
}

export interface DownloadButtonProps extends ToggleBase {
  state: DownloadState;
  /** `0..1` while `downloading`. */
  progress?: number;
  onPress: () => void;
  /** Glyph size. Default `28`. */
  size?: number;
  /** Fixed name; `aria-pressed` is `true` once downloaded. Default `"Download"`. */
  accessibilityLabel?: string;
  /** The progress ring's name. Default `"Download progress"`. */
  progressLabel?: string;
}

export interface FollowButtonProps extends ToggleBase {
  /** Shared Button tone. Defaults to support (secondary). */
  tone?: BloomTone;
  /** Compact toggle with icons and the same accessible name. */
  iconOnly?: boolean;
  following: boolean;
  onFollowChange: (following: boolean) => void;
  /** Default `"Follow"`. The name in both states. */
  label?: string;
  /** Default `"Following"`. */
  followingLabel?: string;
  /** Draw on a band: the pill takes the band's text colour. */
  color?: string;
  /** `small` 32 (default) or `medium` 36 high. */
  size?: 'small' | 'medium';
}

export interface MediaIconButtonProps extends ToggleBase {
  /** A Remix icon component. */
  icon: BloomIconComponent;
  accessibilityLabel: string;
  onPress?: () => void;
  /** Glyph size. Default `24`. */
  size?: number;
  /** Makes it a toggle: `aria-pressed` and an accent glyph when `true`. */
  pressed?: boolean;
  /** Glyph colour at rest. Default: the muted text colour. */
  color?: string;
}

export interface MediaMoreButtonProps extends ToggleBase {
  onPress?: () => void;
  /** Default `"More options"`. */
  accessibilityLabel?: string;
  size?: number;
}

// ---------------------------------------------------------------------------
//  Sticky top bar
// ---------------------------------------------------------------------------

export interface StickyMediaTopBarProps {
  title: string;
  playing: boolean;
  onPlayPress?: () => void;
  artworkColor?: string | null;
  /** Shows the bar (fades in over 200ms, instantly under reduced motion). Ignored when `progress` is given. */
  visible?: boolean;
  /** `0..1`: draws the bar at this opacity — drive it from the scroll position. */
  progress?: number;
  /** Before the play button — a back button. */
  leading?: ReactNode;
  /** At the far right. */
  trailing?: ReactNode;
  /** Default `64`. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MediaHeaderScrollOptions {
  /** Scroll offset (px) where the bar starts fading in. Default `200`. */
  start?: number;
  /** Scroll offset where it is fully shown. Default `start + 80`. */
  end?: number;
  /** Web: follow `window` scroll without wiring `onScroll`. Default `false`. */
  window?: boolean;
}

// ---------------------------------------------------------------------------
//  Artist
// ---------------------------------------------------------------------------

export interface ArtistHeroProps extends HeaderBase {
  name: string;
  /** Full-bleed banner. Without it the band is drawn with a round `avatar`. */
  banner?: MediaImageSource;
  avatar?: MediaImageSource;
  verified?: boolean;
  /** Default `"Verified artist"`. */
  verifiedLabel?: string;
  /** "1,234,567 monthly listeners". */
  listeners?: string;
}

export interface PopularTrack {
  id: string;
  title: string;
  image?: MediaImageSource;
  /** "12,345,678". */
  plays?: string;
  /** "3:45". */
  duration?: string;
  explicit?: boolean;
}

export interface PopularTracksProps {
  tracks: readonly PopularTrack[];
  /** Default `"Popular"`. */
  title?: string;
  /** Rows shown collapsed. Default `5`. */
  collapsedCount?: number;
  /** Rows shown expanded. Default `10`. */
  expandedCount?: number;
  /** Controlled expansion. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Default `"See more"` / `"Show less"`. */
  showMoreLabel?: string;
  showLessLabel?: string;
  /** The row that is the current track: accent title, now-playing bars. */
  activeTrackId?: string;
  playing?: boolean;
  onTrackPress?: (track: PopularTrack, index: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface DiscographyFilterOption {
  value: string;
  label: string;
}

export interface DiscographyFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Default: Albums / Singles and EPs / Compilations (`albums`, `singles`, `compilations`). */
  options?: readonly DiscographyFilterOption[];
  /** Default `"Discography"`. Pass `null` for no heading. */
  title?: string | null;
  onShowAll?: () => void;
  /** Default `"Show all"`. */
  showAllLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ArtistPickProps {
  image?: MediaImageSource;
  title: string;
  /** "Playlist", "Album · 2024". */
  subtitle?: string;
  /** The artist's own words about the pick. */
  note?: string;
  /** Round avatar beside the note. */
  avatar?: MediaImageSource;
  /** Default `"Artist pick"`. */
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ArtistStat {
  /** "1,204,331". */
  value: string;
  /** "Followers". */
  label: string;
}

export interface ArtistStatsProps {
  stats: readonly ArtistStat[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ArtistCity {
  city: string;
  /** "84,120 listeners". */
  count: string;
}

export interface ArtistAboutProps {
  image?: MediaImageSource;
  bio: string;
  /** Lines of bio before "Show more". Default `3`. */
  bioLines?: number;
  stats?: readonly ArtistStat[];
  cities?: readonly ArtistCity[];
  /** Default `"About"`. */
  title?: string;
  /** Default `"Show more"` / `"Show less"`. */
  showMoreLabel?: string;
  showLessLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Podcast, episode, profile, audiobook
// ---------------------------------------------------------------------------

export interface LatestEpisode {
  title: string;
  /** "Sep 12". */
  date?: string;
  /** "48 min". */
  duration?: string;
  description?: string;
  onPress?: () => void;
  playing?: boolean;
  onPlayPress?: () => void;
}

export interface PodcastShowHeaderProps extends HeaderBase {
  title: string;
  cover?: MediaImageSource;
  publisher?: string;
  onPublisherPress?: () => void;
  /** Passed to `Rating`. */
  rating?: number | string | null;
  ratingCount?: number | string;
  categories?: readonly string[];
  onCategoryPress?: (category: string) => void;
  following?: boolean;
  onFollowChange?: (following: boolean) => void;
  description?: string;
  /** Lines of description before "Show more". Default `3`. */
  descriptionLines?: number;
  latestEpisode?: LatestEpisode;
  /** Default `"Podcast"`. */
  typeLabel?: string;
  /** Default `"Latest episode"`. */
  latestEpisodeLabel?: string;
  showMoreLabel?: string;
  showLessLabel?: string;
}

export interface EpisodeHeaderProps extends HeaderBase {
  title: string;
  cover?: MediaImageSource;
  showTitle: string;
  onShowPress?: () => void;
  /** "Sep 12, 2026". */
  date?: string;
  /** "48 min". */
  duration?: string;
  playing: boolean;
  onPlayPress?: () => void;
  /** Listening progress, `0..1`. Draws a bar and `remainingLabel`. */
  progress?: number;
  /** "23 min left". */
  remainingLabel?: string;
  saved?: boolean;
  onSavedChange?: (saved: boolean) => void;
  /** Default `"Save episode"`. */
  saveLabel?: string;
  onSharePress?: () => void;
  /** Default `"Share"`. */
  shareLabel?: string;
  download?: DownloadState;
  downloadProgress?: number;
  onDownloadPress?: () => void;
  onMorePress?: () => void;
  /** Default `"Podcast episode"`. */
  typeLabel?: string;
}

export interface ProfileStat {
  /** "12 public playlists". */
  label: string;
  onPress?: () => void;
}

export interface ProfileHeaderProps extends HeaderBase {
  name: string;
  avatar?: MediaImageSource;
  /** Default `"Profile"`. */
  typeLabel?: string;
  stats?: readonly ProfileStat[];
  /** Another listener's profile: the follow pill. */
  following?: boolean;
  onFollowChange?: (following: boolean) => void;
  /** Your own profile: an "Edit profile" button. */
  onEditPress?: () => void;
  /** Default `"Edit profile"`. */
  editLabel?: string;
  onMorePress?: () => void;
}

export interface AudiobookHeaderProps extends HeaderBase {
  title: string;
  cover?: MediaImageSource;
  /** Default `"Audiobook"`. */
  typeLabel?: string;
  /** "Wren Calloway". */
  author?: string;
  onAuthorPress?: () => void;
  /** "Narrated by Ada Moss". */
  narrator?: string;
  /** "11 h 42 min". */
  duration?: string;
  /** "32 chapters". */
  chapters?: string;
  /** Listening progress `0..1`. */
  progress?: number;
  /** "4 h 10 min left". */
  progressLabel?: string;
  rating?: number | string | null;
  ratingCount?: number | string;
}
