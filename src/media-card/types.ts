import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/** Cover side in the `tile` layout: `large` 200, `medium` 160 (default), `small` 120. */
export type MediaCardSize = 'large' | 'medium' | 'small';

/**
 * `tile` — artwork on top, text under it (a shelf or a grid).
 * `row` — a 56 (48 at `small`) cover on the left, text, then a trailing slot (a list).
 */
export type MediaCardLayout = 'tile' | 'row';

/**
 * When the overlaid play button shows.
 *
 * `auto` (default): on web it fades and slides in while the card is hovered or
 * holds keyboard focus; on native it is not drawn (a tap on the card plays).
 * Either way it stays visible while the card is `playing`, `loading` or `current`.
 * `always`: drawn on both platforms. `never`: not drawn.
 */
export type MediaCardPlayButton = 'auto' | 'always' | 'never';

/** One row of the card's "More options" menu. */
export interface MediaCardMenuItem {
  label: string;
  onPress?: () => void;
  /** Leading icon element. */
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

/** The props every card that plays something shares. */
export interface MediaCardCommonProps {
  /** Opens the item. On web with `href` the default navigation is replaced. */
  onPress?: () => void;
  /** Makes the card a real link on web (`<a href>`); native opens it when there is no `onPress`. */
  href?: string;
  /** Plays / pauses. Without it no play button is drawn. */
  onPlay?: () => void;
  /** The item is playing: the play button draws pause and stays visible. */
  playing?: boolean;
  /** The play button shows its spinner (buffering) and stays visible. */
  loading?: boolean;
  /** The item is the one loaded in the player (playing or paused): the button stays visible. */
  current?: boolean;
  /** Default `auto`. */
  playButton?: MediaCardPlayButton;
  /** Rows of the "More options" menu. Also opened by a right-click (web) or a long press (native). */
  menuItems?: ReadonlyArray<MediaCardMenuItem>;
  /** Menu content as nodes (`DropdownMenuItem`s …) — takes precedence over `menuItems`. */
  menu?: ReactNode;
  /** The menu trigger's name. Default `"More options"`. */
  menuLabel?: string;
  /** Default `medium`. */
  size?: MediaCardSize;
  /** Default `tile`. */
  layout?: MediaCardLayout;
  /** Paints the selected wash; `aria-current` on web, `selected` state on native. */
  selected?: boolean;
  /** Draws the shimmering placeholder instead of the card. */
  skeleton?: boolean;
  /** Replaces the composed accessible name. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Props shared by the cards that draw one piece of artwork. */
export interface MediaCardArtworkProps {
  /** A URL, or an id the app's `ImageResolver` turns into one. */
  artwork?: string;
  /** Passed to the `ImageResolver` with an id. */
  artworkVariant?: string;
  /**
   * The artwork's dominant colour (hex from the backend). Paints the
   * placeholder gradient when there is no artwork; neutral without it.
   */
  artworkColor?: string;
}

// ---------------------------------------------------------------------------
//  MediaCard — the shared anatomy, also usable directly
// ---------------------------------------------------------------------------

export type MediaCardArtworkShape = 'square' | 'round';

export interface MediaCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  /** The first line under the title (text or nodes). */
  subtitle?: ReactNode;
  /** Further lines under the subtitle. */
  meta?: ReadonlyArray<string>;
  /** What the item is ("Album", "Podcast"), used in the accessible name. */
  typeLabel?: string;
  /** Default `square`. */
  artworkShape?: MediaCardArtworkShape;
  /** Corner radius of a square cover. Default 8 (6 at `small` and in rows). */
  artworkRadius?: number;
  /** Width : height of the cover. Default `1`. */
  artworkAspectRatio?: number;
  /** Replaces the drawn artwork (a mosaic, a generated cover). Sized by the card. */
  renderArtwork?: (box: { width: number; height: number }) => ReactNode;
  /** Static decoration drawn over the cover, under the play button (a date leaf). */
  artworkOverlay?: ReactNode;
  /** Glyph drawn on the generated placeholder cover. */
  placeholderIcon?: BloomIconComponent;
  /** Drawn after the title on its line (an explicit badge, a verified mark). */
  titleAccessory?: ReactNode;
  /** Words the accessory adds to the accessible name ("Explicit", "Verified"). */
  titleAccessoryLabel?: string;
  /** Lines the title may take. Default 1. */
  titleLines?: number;
  /** Lines the subtitle may take. Default 1. */
  subtitleLines?: number;
  /** The subtitle holds its own pressables (artist links): it is drawn above the card link. */
  interactiveSubtitle?: boolean;
  /** Row layout only: between the text and the menu (duration, like button). */
  trailing?: ReactNode;
  /** Under the text, outside the link (progress, action buttons). Indented to the text in a row. */
  footer?: ReactNode;
  /** Words appended to the accessible name ("Played", "12 min left"). */
  accessibilityDetail?: string;
  /** Text lines are centred under the cover (tile layout). */
  centered?: boolean;
  /** A caption above the title ("12 Sep · 48 min"). */
  eyebrow?: string;
  /** Up to two lines after the meta lines. */
  description?: string;
  /** Drawn before the title on its line (the now-playing bars). */
  titleLeading?: ReactNode;
  /** Replaces the cover's width (and, through the aspect ratio, its height). */
  artworkSize?: number;
  /** Row layout: centre the parts vertically (default) or align them to the top. */
  rowAlign?: 'center' | 'top';
}

// ---------------------------------------------------------------------------
//  Typed cards
// ---------------------------------------------------------------------------

export interface SongCardArtist {
  name: string;
  id?: string;
}

export interface SongCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  /** Names, or `{ name, id }` — each is pressable when `onPressArtist` is set. */
  artists?: ReadonlyArray<string | SongCardArtist>;
  onPressArtist?: (artist: SongCardArtist, index: number) => void;
  /** Row layout: the album, a second line after the artists. */
  album?: string;
  explicit?: boolean;
  /** Pre-formatted ("3:45"). Drawn in the row layout. */
  duration?: string;
  /** Row layout: draws a `LikeButton`. */
  liked?: boolean;
  onLikedChange?: (liked: boolean) => void;
  /** Default `"Song"`. */
  typeLabel?: string;
}

export type AlbumCardType = 'album' | 'single' | 'ep' | 'compilation';

export interface AlbumCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  artist?: string;
  /** Pre-formatted ("2026"). */
  year?: string;
  /** Default `album`. */
  albumType?: AlbumCardType;
  /** The words for each type. Default Album / Single / EP / Compilation. */
  typeLabels?: Partial<Record<AlbumCardType, string>>;
  explicit?: boolean;
}

export interface ArtistCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  name: string;
  verified?: boolean;
  /** Pre-formatted ("1.2M followers"). */
  followers?: string;
  /** Default `"Artist"`. */
  typeLabel?: string;
  /** Default `"Verified"`. */
  verifiedLabel?: string;
}

export interface PlaylistCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  /** The owner's display name: "By Maya". */
  owner?: string;
  /** Default `"By"`. */
  ownerPrefix?: string;
  /** Pre-formatted ("42 songs"). */
  trackCount?: string;
  /** Without `artwork`: up to four track covers drawn as a 2×2 mosaic. */
  mosaic?: ReadonlyArray<string>;
  /** Draws the shared-playlist glyph before the owner line. */
  collaborative?: boolean;
  /** Default `"Collaborative"`. */
  collaborativeLabel?: string;
  /** Default `"Playlist"`. */
  typeLabel?: string;
}

export interface MixCardProps extends MediaCardCommonProps {
  title: string;
  /** The generated cover's colour (hex). Neutral without it. */
  artworkColor?: string;
  /** The words drawn big on the cover. Default: `title`. */
  coverTitle?: string;
  /** Up to four artist photos (URLs or ids) drawn small on the cover. */
  faces?: ReadonlyArray<string>;
  /** Pre-formatted artists line ("Mara Vell, Juno Park and more"). */
  description?: string;
  /** Default `"Mix"`. */
  typeLabel?: string;
}

export interface PodcastCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  publisher?: string;
  /** Default `"Podcast"`. */
  typeLabel?: string;
}

export interface EpisodeCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  /** The show's name. */
  show?: string;
  /** Pre-formatted ("12 Sep"). */
  date?: string;
  /** Pre-formatted ("48 min"). */
  duration?: string;
  /** Clamped to two lines. */
  description?: string;
  explicit?: boolean;
  /** Listened fraction, `0..1`. Drawn as a bar when above 0 and not `played`. */
  progress?: number;
  /** Pre-formatted ("12 min left"), beside the bar. */
  remaining?: string;
  /** Finished: a check and `playedLabel` replace the bar. */
  played?: boolean;
  /** Default `"Played"`. */
  playedLabel?: string;
  /** Icon buttons after the progress (save, download). */
  actions?: ReactNode;
  /** Default `"Episode"`. */
  typeLabel?: string;
}

export interface AudiobookCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  title: string;
  author?: string;
  /** The narrator's name: "Narrated by Ines Calder". */
  narrator?: string;
  /** Default `"Narrated by"`. */
  narratorPrefix?: string;
  /** Pre-formatted ("11 h 20 min"). */
  duration?: string;
  /** Listened fraction, `0..1`. */
  progress?: number;
  /** Default `"Audiobook"`. */
  typeLabel?: string;
}

export interface GenreCardProps
  extends Pick<MediaCardCommonProps, 'onPress' | 'href' | 'size' | 'accessibilityLabel' | 'skeleton' | 'style' | 'testID'> {
  title: string;
  /** The tile colour (hex). Darkened as far as needed to keep the title legible. */
  color?: string;
  /** Artwork that peeks, rotated, from the bottom-right corner. */
  artwork?: string;
  artworkVariant?: string;
}

export interface EventCardProps extends MediaCardCommonProps {
  title: string;
  /** Pre-formatted month abbreviation ("Oct"). */
  month: string;
  /** Pre-formatted day ("14"). */
  day: string;
  /** A URL or resolver id. */
  image?: string;
  imageVariant?: string;
  venue?: string;
  city?: string;
  /** Pre-formatted ("Fri 20:00"). */
  time?: string;
  /** The tickets button. */
  action?: ReactNode;
  soldOut?: boolean;
  /** Default `"Sold out"`. */
  soldOutLabel?: string;
  /** Default `"Event"`. */
  typeLabel?: string;
}

export interface ProfileCardProps extends MediaCardCommonProps, MediaCardArtworkProps {
  name: string;
  /** Adds "Follows you" to the label line. */
  followsYou?: boolean;
  /** Default `"Profile"`. */
  typeLabel?: string;
  /** Default `"Follows you"`. */
  followsYouLabel?: string;
  /** Pre-formatted ("214 followers"). */
  followers?: string;
  /** The follow button. */
  action?: ReactNode;
}

export interface FriendActivityCardProps
  extends Pick<
    MediaCardCommonProps,
    'onPress' | 'href' | 'skeleton' | 'selected' | 'accessibilityLabel' | 'style' | 'testID'
  > {
  name: string;
  /** Avatar URL or resolver id. */
  avatar?: string;
  track: string;
  artist: string;
  /** Where it plays from ("Late Hours Playlist"). */
  context?: string;
  /** `playlist` (default) or `album` — the context line's glyph. */
  contextType?: 'playlist' | 'album';
  /** Listening right now: the avatar dot and moving bars replace `time`. */
  live?: boolean;
  /** Pre-formatted ("12 min"). */
  time?: string;
  /** Default `"Listening now"`. */
  liveLabel?: string;
}

export interface QuickAccessTileProps
  extends Pick<
    MediaCardCommonProps,
    | 'onPress'
    | 'href'
    | 'onPlay'
    | 'playing'
    | 'loading'
    | 'current'
    | 'skeleton'
    | 'selected'
    | 'accessibilityLabel'
    | 'style'
    | 'testID'
  >,
    MediaCardArtworkProps {
  title: string;
  /** Round cover (an artist). */
  round?: boolean;
  /** What the item is, for the accessible name. */
  typeLabel?: string;
}

export interface RecapHighlight {
  /** "Top artist". */
  label: string;
  title: string;
  artwork?: string;
  round?: boolean;
}

export interface RecapCardProps {
  /** "Your 2026 in sound". */
  eyebrow?: string;
  /** The big number, pre-formatted ("48,210"). */
  value: string;
  /** "minutes listened". */
  unit?: string;
  /** Hex the gradient is built from. Neutral without it. */
  artworkColor?: string;
  highlights?: ReadonlyArray<RecapHighlight>;
  onShare?: () => void;
  /** Default `"Share"`. */
  shareLabel?: string;
  skeleton?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ShareCardProps extends MediaCardArtworkProps {
  title: string;
  artist: string;
  /** Lines of a lyrics excerpt, drawn in a block under the title. */
  lyrics?: ReadonlyArray<string>;
  /** Under everything (a small wordmark, a link). */
  footer?: ReactNode;
  explicit?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
