import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the media-header family draws or announces, in each
 * Bloom language. "More options", "Show more"/"Show less" come from the
 * common words; play/pause and the like button from `MEDIA_CONTROLS_MESSAGES`.
 * A caller's `*Label`/`title` prop still wins over any entry.
 */
export interface MediaHeaderMessages {
  /** `ArtistPick`'s label. */
  artistPick: string;
  saveEpisode: string;
  share: string;
  podcastEpisode: string;
  /** The episode and audiobook progress bar's name. */
  listeningProgress: string;
  shuffle: string;
  download: string;
  downloadProgress: string;
  /** `FollowButton` before and after. */
  follow: string;
  following: string;
  searchInPlaylist: string;
  compactView: string;
  editDetails: string;
  /** `ArtistAbout`'s heading. */
  about: string;
  discography: string;
  showAll: string;
  /** `DiscographyFilter`'s default chips. */
  albums: string;
  singlesAndEps: string;
  compilations: string;
  audiobook: string;
  popular: string;
  /** `PopularTracks`' expand button. */
  seeMore: string;
  podcast: string;
  latestEpisode: string;
  verifiedArtist: string;
  profile: string;
  editProfile: string;
}

export const MEDIA_HEADER_MESSAGES: MessageCatalog<MediaHeaderMessages> = defineMessages<MediaHeaderMessages>('MEDIA_HEADER_MESSAGES', {
  artistPick: 'Artist pick',
  saveEpisode: 'Save episode',
  share: 'Share',
  podcastEpisode: 'Podcast episode',
  listeningProgress: 'Listening progress',
  shuffle: 'Shuffle',
  download: 'Download',
  downloadProgress: 'Download progress',
  follow: 'Follow',
  following: 'Following',
  searchInPlaylist: 'Search in playlist',
  compactView: 'Compact view',
  editDetails: 'Edit details',
  about: 'About',
  discography: 'Discography',
  showAll: 'Show all',
  albums: 'Albums',
  singlesAndEps: 'Singles and EPs',
  compilations: 'Compilations',
  audiobook: 'Audiobook',
  popular: 'Popular',
  seeMore: 'See more',
  podcast: 'Podcast',
  latestEpisode: 'Latest episode',
  verifiedArtist: 'Verified artist',
  profile: 'Profile',
  editProfile: 'Edit profile',
});
