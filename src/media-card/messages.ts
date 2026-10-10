import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { AlbumCardType } from './types';

/**
 * Every fixed string the media-card family draws or announces, in each Bloom
 * language. "Explicit", "Now playing" and the like button's name come from
 * `MEDIA_CONTROLS_MESSAGES`; "Loading" and "More options" from the common
 * words. A caller's `*Label`/`*Prefix` prop still wins over any entry.
 */
export interface MediaCardMessages {
  /** `AlbumCard`'s type word per `albumType`. */
  albumTypes: Record<AlbumCardType, string>;
  artist: string;
  /** `ArtistCard`'s verified mark, in its name. */
  verified: string;
  audiobook: string;
  /** `AudiobookCard`'s narrator line: "Narrated by Teo Marsh". */
  narratedBy: (narrator: string) => string;
  /** A listened bar's name: "Tide Tables progress". */
  progressOf: (title: string) => string;
  episode: string;
  played: string;
  event: string;
  soldOut: string;
  /** `FriendActivityCard`'s live line. */
  listeningNow: string;
  /** `FriendActivityCard`'s name: "Night Drive by Mara Vell". */
  trackBy: (track: string, artist: string) => string;
  mix: string;
  playlist: string;
  collaborative: string;
  /** `PlaylistCard`'s owner: "By Maya". */
  ownedBy: (owner: string) => string;
  podcast: string;
  profile: string;
  followsYou: string;
  song: string;
  share: string;
  /** A listened bar's name when no title is given. */
  listened: string;
}

export const MEDIA_CARD_MESSAGES: MessageCatalog<MediaCardMessages> =
  defineMessages<MediaCardMessages>('MEDIA_CARD_MESSAGES', {
    albumTypes: { album: 'Album', single: 'Single', ep: 'EP', compilation: 'Compilation' },
    artist: 'Artist',
    verified: 'Verified',
    audiobook: 'Audiobook',
    narratedBy: (n) => `Narrated by ${n}`,
    progressOf: (t) => `${t} progress`,
    episode: 'Episode',
    played: 'Played',
    event: 'Event',
    soldOut: 'Sold out',
    listeningNow: 'Listening now',
    trackBy: (t, a) => `${t} by ${a}`,
    mix: 'Mix',
    playlist: 'Playlist',
    collaborative: 'Collaborative',
    ownedBy: (o) => `By ${o}`,
    podcast: 'Podcast',
    profile: 'Profile',
    followsYou: 'Follows you',
    song: 'Song',
    share: 'Share',
    listened: 'Listened',
  });
