import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { FileKind } from './types';

/**
 * Every fixed string the message-media family draws or announces, in each
 * Bloom language. The common words (Cancel, Retry) come from
 * `COMMON_MESSAGES`; a caller's `*Label` / `format*` prop still wins over any
 * entry here.
 */
export interface MessageMediaMessages {
  /** A photo's name, and a video's. */
  photo: string;
  video: string;
  /** "Photo 2 of 5" / "Video 2 of 5" — a cell in an album or a grid. */
  photoOf: (index: number, total: number) => string;
  videoOf: (index: number, total: number) => string;
  /** The spoiler cover's text and hint. */
  tapToView: string;
  /** The indeterminate ring's name while an attachment sends. */
  sendingPhoto: string;
  sendingVideo: string;
  sendingAlbum: string;
  sendingSticker: string;
  sendingGif: string;
  /** Names an album: "Album, 3 items". */
  album: (count: number) => string;
  /** Names the shared-media grid: "Shared media, 12 items". */
  sharedMedia: (count: number) => string;
  /** Names the shared-files list: "Shared files, 4 items". */
  sharedFiles: (count: number) => string;
  /** The last grid tile past `maxItems`: "+5 more". */
  moreItems: (count: number) => string;
  /** The failed-send row. */
  notSent: string;
  /** `VoiceMessage`: the block's name, "Voice message, 0:14". */
  voiceMessage: (duration: string) => string;
  playVoiceMessage: string;
  pauseVoiceMessage: string;
  transcribe: string;
  hideTranscript: string;
  seek: string;
  /** The waveform slider's value: "0:03 of 0:14". */
  seekPosition: (position: string, duration: string) => string;
  /** The speed pill's name: "Playback speed, 1.5×". */
  playbackSpeed: (rate: string) => string;
  unplayed: string;
  /** `FileMessage`. */
  download: string;
  downloaded: string;
  /** The type word for a file with no extension and no known kind. */
  file: string;
  /** The type word for a file with no extension, by the kind its MIME type gave. */
  fileKinds: Record<Exclude<FileKind, 'other'>, string>;
  /** `ContactMessage`: the card's name prefix and its two actions. */
  contact: string;
  message: string;
  add: string;
  /** `LocationMessage`. */
  location: string;
  liveLocation: string;
  stopSharing: string;
  /** `PollMessage`. */
  vote: string;
  viewResults: string;
  anonymousVoting: string;
  quiz: string;
  selectOne: string;
  selectOneOrMore: string;
  correctAnswer: string;
  yourAnswer: string;
  /** The footer: "No votes" / "1 vote" / "23 votes". */
  votes: (count: number) => string;
  /** `StickerMessage`'s name when the caller gives none. */
  sticker: string;
}

const items = { en: (n: number) => plural('en', n, { one: '{n} item', other: '{n} items' }) };

export const MESSAGE_MEDIA_MESSAGES: MessageCatalog<MessageMediaMessages> =
  defineMessages<MessageMediaMessages>('MESSAGE_MEDIA_MESSAGES', {
    photo: 'Photo',
    video: 'Video',
    photoOf: (i, total) => `Photo ${i} of ${total}`,
    videoOf: (i, total) => `Video ${i} of ${total}`,
    tapToView: 'Tap to view',
    sendingPhoto: 'Sending photo',
    sendingVideo: 'Sending video',
    sendingAlbum: 'Sending album',
    sendingSticker: 'Sending sticker',
    sendingGif: 'Sending GIF',
    album: (n) => `Album, ${items.en(n)}`,
    sharedMedia: (n) => `Shared media, ${items.en(n)}`,
    sharedFiles: (n) => `Shared files, ${items.en(n)}`,
    moreItems: (n) => `+${n} more`,
    notSent: 'Not sent',
    voiceMessage: (d) => `Voice message, ${d}`,
    playVoiceMessage: 'Play voice message',
    pauseVoiceMessage: 'Pause voice message',
    transcribe: 'Transcribe',
    hideTranscript: 'Hide transcript',
    seek: 'Seek',
    seekPosition: (p, d) => `${p} of ${d}`,
    playbackSpeed: (r) => `Playback speed, ${r}`,
    unplayed: 'Unplayed',
    download: 'Download',
    downloaded: 'Downloaded',
    file: 'File',
    fileKinds: {
      pdf: 'PDF',
      doc: 'DOC',
      sheet: 'SHEET',
      slides: 'SLIDES',
      zip: 'ZIP',
      audio: 'AUDIO',
      video: 'VIDEO',
      image: 'IMAGE',
      code: 'CODE',
    },
    contact: 'Contact',
    message: 'Message',
    add: 'Add',
    location: 'Location',
    liveLocation: 'Live location',
    stopSharing: 'Stop sharing',
    vote: 'Vote',
    viewResults: 'View results',
    anonymousVoting: 'Anonymous voting',
    quiz: 'Quiz',
    selectOne: 'Select one',
    selectOneOrMore: 'Select one or more',
    correctAnswer: 'correct answer',
    yourAnswer: 'your answer',
    votes: (n) => (n === 0 ? 'No votes' : plural('en', n, { one: '{n} vote', other: '{n} votes' })),
    sticker: 'Sticker',
  });
