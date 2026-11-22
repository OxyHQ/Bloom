import {
  AlbumCard as BloomAlbumCard,
  type AlbumCardProps,
  ArtistCard as BloomArtistCard,
  type ArtistCardProps,
  AudiobookCard as BloomAudiobookCard,
  type AudiobookCardProps,
  EpisodeCard as BloomEpisodeCard,
  type EpisodeCardProps,
  EventCard as BloomEventCard,
  type EventCardProps,
  FriendActivityCard as BloomFriendActivityCard,
  type FriendActivityCardProps,
  GenreCard as BloomGenreCard,
  type GenreCardProps,
  MediaCard as BloomMediaCard,
  type MediaCardProps,
  MixCard as BloomMixCard,
  type MixCardProps,
  PlaylistCard as BloomPlaylistCard,
  type PlaylistCardProps,
  PodcastCard as BloomPodcastCard,
  type PodcastCardProps,
  ProfileCard as BloomProfileCard,
  type ProfileCardProps,
  QuickAccessTile as BloomQuickAccessTile,
  type QuickAccessTileProps,
  RecapCard as BloomRecapCard,
  type RecapCardProps,
  ShareCard as BloomShareCard,
  type ShareCardProps,
  SongCard as BloomSongCard,
  type SongCardProps,
} from '@oxy.so/bloom/media-card';

import { type Child, Node, type ViewModifiers } from '../node';
import type { MediaCardLayout, MediaCardSize } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { type CornerToken, product, slot } from './product';
import type { SpaceToken } from '../tokens';

/** Every card a music or audio app shows. */
export type MediaCardKind =
  | 'mediaCard'
  | 'songCard'
  | 'albumCard'
  | 'artistCard'
  | 'playlistCard'
  | 'mixCard'
  | 'podcastCard'
  | 'episodeCard'
  | 'audiobookCard'
  | 'genreCard'
  | 'eventCard'
  | 'profileCard'
  | 'friendActivityCard'
  | 'quickAccessTile'
  | 'recapCard'
  | 'shareCard';

/** What the node draws itself: its press and name, its look modifiers. */
type Drawn = 'style' | 'testID' | 'accessibilityLabel' | 'onPress';
type Look = 'size' | 'layout' | 'loading';
/** A card's "More options" content, a language child (Bloom's `menu`). */
type Menu = { readonly menu?: Child };

type MediaCardSlots = 'artworkOverlay' | 'titleAccessory' | 'trailing' | 'footer' | 'titleLeading';
/**
 * Bloom `MediaCard`'s data. Its subtitle is text or a language child; its
 * slots and its cover (`renderArtwork`, a function of the cover's box) are
 * language children; the cover's size is a space token and its radius a
 * corner rung.
 */
export type MediaCardOptions = Omit<
  MediaCardProps,
  | Drawn
  | Look
  | 'title'
  | 'menu'
  | 'subtitle'
  | 'renderArtwork'
  | 'artworkSize'
  | 'artworkRadius'
  | MediaCardSlots
> &
  Menu & { readonly [K in MediaCardSlots]?: Child } & {
    readonly subtitle?: string | Child;
    readonly renderArtwork?: (box: { width: number; height: number }) => Child;
    readonly artworkSize?: SpaceToken;
    readonly artworkRadius?: CornerToken;
  };
export type SongCardOptions = Omit<SongCardProps, Drawn | Look | 'title' | 'menu'> & Menu;
export type AlbumCardOptions = Omit<AlbumCardProps, Drawn | Look | 'title' | 'menu'> & Menu;
export type ArtistCardOptions = Omit<ArtistCardProps, Drawn | Look | 'name' | 'menu'> & Menu;
export type PlaylistCardOptions = Omit<PlaylistCardProps, Drawn | Look | 'title' | 'menu'> & Menu;
export type MixCardOptions = Omit<MixCardProps, Drawn | Look | 'title' | 'menu'> & Menu;
export type PodcastCardOptions = Omit<PodcastCardProps, Drawn | Look | 'title' | 'menu'> & Menu;
/** Bloom `EpisodeCard`'s data; its `actions` are a language child. */
export type EpisodeCardOptions = Omit<
  EpisodeCardProps,
  Drawn | Look | 'title' | 'menu' | 'actions'
> &
  Menu & { readonly actions?: Child };
export type AudiobookCardOptions = Omit<AudiobookCardProps, Drawn | Look | 'title' | 'menu'> & Menu;
export type GenreCardOptions = Omit<GenreCardProps, Drawn | 'size' | 'title'>;
/** Bloom `EventCard`'s data (its date is required); its tickets `action` is a language child. */
export type EventCardOptions = Omit<EventCardProps, Drawn | Look | 'title' | 'menu' | 'action'> &
  Menu & { readonly action?: Child };
/** Bloom `ProfileCard`'s data; its follow `action` is a language child. */
export type ProfileCardOptions = Omit<ProfileCardProps, Drawn | Look | 'name' | 'menu' | 'action'> &
  Menu & { readonly action?: Child };
/** Bloom `FriendActivityCard`'s data: what the friend plays (`track` and `artist`) and where. */
export type FriendActivityCardOptions = Omit<FriendActivityCardProps, Drawn | 'name'>;
export type QuickAccessTileOptions = Omit<QuickAccessTileProps, Drawn | 'loading' | 'title'>;
export type RecapCardOptions = Omit<RecapCardProps, 'style' | 'testID' | 'value'>;
/** Bloom `ShareCard`'s data (its `artist` is required); its `footer` is a language child. */
export type ShareCardOptions = Omit<ShareCardProps, 'style' | 'testID' | 'title' | 'footer'> & {
  readonly footer?: Child;
};

/** A card that plays something: its size, its tile or row layout, and its play button's spinner. */
export interface PlayableCardView<V> extends ViewModifiers<V> {
  /** `large`, `medium` (default) or `small`. */
  size(value: MediaCardSize): V;
  /** `tile` (default) or `row`. */
  style(value: MediaCardLayout): V;
  /** The play button shows its spinner and stays visible. */
  loading(value?: boolean): V;
}
/** Bloom `MediaCard`; `.onPress()` opens the item and `.label()` replaces its name. */
export interface MediaCardView extends PlayableCardView<MediaCardView> {}
export interface SongCardView extends PlayableCardView<SongCardView> {}
export interface AlbumCardView extends PlayableCardView<AlbumCardView> {}
export interface ArtistCardView extends PlayableCardView<ArtistCardView> {}
export interface PlaylistCardView extends PlayableCardView<PlaylistCardView> {}
export interface MixCardView extends PlayableCardView<MixCardView> {}
export interface PodcastCardView extends PlayableCardView<PodcastCardView> {}
export interface EpisodeCardView extends PlayableCardView<EpisodeCardView> {}
export interface AudiobookCardView extends PlayableCardView<AudiobookCardView> {}
export interface EventCardView extends PlayableCardView<EventCardView> {}
export interface ProfileCardView extends PlayableCardView<ProfileCardView> {}
export interface GenreCardView extends ViewModifiers<GenreCardView> {
  size(value: MediaCardSize): GenreCardView;
}
export type FriendActivityCardView = ViewModifiers<FriendActivityCardView>;
export interface QuickAccessTileView extends ViewModifiers<QuickAccessTileView> {
  loading(value?: boolean): QuickAccessTileView;
}
/** Bloom `RecapCard`; it takes no press of its own (`onShare` is its button's). */
export type RecapCardView = ViewModifiers<RecapCardView>;
export type ShareCardView = ViewModifiers<ShareCardView>;

export function MediaCard(title: string, options: MediaCardOptions = {}): MediaCardView {
  return new Node('mediaCard', { title, options }, []);
}
export function SongCard(title: string, options: SongCardOptions = {}): SongCardView {
  return new Node('songCard', { title, options }, []);
}
export function AlbumCard(title: string, options: AlbumCardOptions = {}): AlbumCardView {
  return new Node('albumCard', { title, options }, []);
}
export function ArtistCard(name: string, options: ArtistCardOptions = {}): ArtistCardView {
  return new Node('artistCard', { name, options }, []);
}
export function PlaylistCard(title: string, options: PlaylistCardOptions = {}): PlaylistCardView {
  return new Node('playlistCard', { title, options }, []);
}
export function MixCard(title: string, options: MixCardOptions = {}): MixCardView {
  return new Node('mixCard', { title, options }, []);
}
export function PodcastCard(title: string, options: PodcastCardOptions = {}): PodcastCardView {
  return new Node('podcastCard', { title, options }, []);
}
export function EpisodeCard(title: string, options: EpisodeCardOptions = {}): EpisodeCardView {
  return new Node('episodeCard', { title, options }, []);
}
export function AudiobookCard(
  title: string,
  options: AudiobookCardOptions = {},
): AudiobookCardView {
  return new Node('audiobookCard', { title, options }, []);
}
export function GenreCard(title: string, options: GenreCardOptions = {}): GenreCardView {
  return new Node('genreCard', { title, options }, []);
}
export function EventCard(title: string, options: EventCardOptions): EventCardView {
  return new Node('eventCard', { title, options }, []);
}
export function ProfileCard(name: string, options: ProfileCardOptions = {}): ProfileCardView {
  return new Node('profileCard', { name, options }, []);
}
export function FriendActivityCard(
  name: string,
  options: FriendActivityCardOptions,
): FriendActivityCardView {
  return new Node('friendActivityCard', { name, options }, []);
}
export function QuickAccessTile(
  title: string,
  options: QuickAccessTileOptions = {},
): QuickAccessTileView {
  return new Node('quickAccessTile', { title, options }, []);
}
export function RecapCard(value: string, options: RecapCardOptions = {}): RecapCardView {
  return new Node('recapCard', { value, options }, []);
}
export function ShareCard(title: string, options: ShareCardOptions): ShareCardView {
  return new Node('shareCard', { title, options }, []);
}

/** A playable card's look: its size, its layout and its play button's spinner. */
function look(d: ControlDraw): Record<string, unknown> {
  return {
    size: d.own('size')?.value,
    layout: d.own('style')?.value,
    loading: d.own('loading')?.value,
  };
}

/** A card that opens its item itself, with its slots drawn and its look from its modifiers. */
function card(host: unknown, ...slots: string[]): ControlRenderer {
  return product(host, { press: true, slots: ['menu', ...slots], own: look });
}

export const MEDIA_CARDS: Record<MediaCardKind, ControlRenderer> = {
  mediaCard: product(BloomMediaCard, {
    press: true,
    slots: ['menu', 'artworkOverlay', 'titleAccessory', 'trailing', 'footer', 'titleLeading'],
    lengths: ['artworkSize'],
    corners: ['artworkRadius'],
    own: (d) => {
      const { subtitle, renderArtwork } = (d.node.props as { options: MediaCardOptions }).options;
      return {
        ...look(d),
        subtitle: typeof subtitle === 'string' ? subtitle : slot(d, subtitle),
        renderArtwork:
          renderArtwork === undefined
            ? undefined
            : (box: { width: number; height: number }) => d.render(renderArtwork(box)),
      };
    },
  }),
  songCard: card(BloomSongCard),
  albumCard: card(BloomAlbumCard),
  artistCard: card(BloomArtistCard),
  playlistCard: card(BloomPlaylistCard),
  mixCard: card(BloomMixCard),
  podcastCard: card(BloomPodcastCard),
  episodeCard: card(BloomEpisodeCard, 'actions'),
  audiobookCard: card(BloomAudiobookCard),
  eventCard: card(BloomEventCard, 'action'),
  profileCard: card(BloomProfileCard, 'action'),
  genreCard: product(BloomGenreCard, {
    press: true,
    own: (d) => ({ size: d.own('size')?.value }),
  }),
  friendActivityCard: product(BloomFriendActivityCard, { press: true }),
  quickAccessTile: product(BloomQuickAccessTile, {
    press: true,
    own: (d) => ({ loading: d.own('loading')?.value }),
  }),
  recapCard: product(BloomRecapCard),
  shareCard: product(BloomShareCard, { slots: ['footer'] }),
};
