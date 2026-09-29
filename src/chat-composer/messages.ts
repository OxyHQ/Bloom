import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { SuggestionKind } from './types';

/** The ids of the default attachment menu rows. */
export type AttachmentMenuItemId = 'gallery' | 'camera' | 'file' | 'location' | 'contact' | 'poll' | 'music';

/**
 * Every fixed string the chat-composer family draws or announces, in each Bloom
 * language, except the common words (Send, Cancel, …), which come from
 * `COMMON_MESSAGES`. A caller's `labels` / `*Label` prop still wins.
 */
export interface ChatComposerMessages {
  /** `ChatComposer`'s controls. Send comes from `COMMON_MESSAGES`. */
  attach: string;
  /** Also the emoji picker's own tab. */
  emoji: string;
  camera: string;
  mic: string;
  /** The field's name and its placeholder. */
  message: string;
  /** Keyboard hints under the bar on web. */
  enterHint: string;
  modEnterHint: string;
  /** `VoiceRecorder`. */
  cancelRecording: string;
  sendVoice: string;
  deleteRecording: string;
  playRecording: string;
  pauseRecording: string;
  lockRecording: string;
  slideToCancel: string;
  recording: string;
  /** `EmojiPicker`. */
  searchEmoji: string;
  noEmoji: string;
  frequentlyUsed: string;
  skinTone: string;
  emojiPicker: string;
  /** `ReactionPicker`. */
  moreReactions: string;
  quickReactions: string;
  /** `MessageContextMenu`'s name. */
  messageActions: string;
  /** `ComposerAttachmentStrip`'s name, and a tile's remove control: "Remove photo.jpg". */
  attachments: string;
  removeAttachment: (name: string) => string;
  /** `SuggestionList`'s name per kind. */
  suggestions: Record<SuggestionKind, string>;
  /** A suggestion row's verified marker, as announced. */
  suggestionVerified: string;
  /** `SuggestionList` while its caller is still searching. */
  searchingSuggestions: string;
  /** `SuggestionList` when a finished search found nothing, per kind. */
  noSuggestions: Record<SuggestionKind, string>;
  /** `AttachmentMenu`'s default rows. */
  attachmentItems: Record<AttachmentMenuItemId, string>;
}

export const CHAT_COMPOSER_MESSAGES: MessageCatalog<ChatComposerMessages> = defineMessages<ChatComposerMessages>('CHAT_COMPOSER_MESSAGES', {
  attach: 'Attach',
  emoji: 'Emoji',
  camera: 'Camera',
  mic: 'Record a voice message',
  message: 'Message',
  enterHint: 'Enter to send · Shift + Enter for a new line',
  modEnterHint: '⌘ + Enter to send · Enter for a new line',
  cancelRecording: 'Cancel recording',
  sendVoice: 'Send voice message',
  deleteRecording: 'Delete recording',
  playRecording: 'Play recording',
  pauseRecording: 'Pause recording',
  lockRecording: 'Lock recording',
  slideToCancel: 'Slide to cancel',
  recording: 'Recording',
  searchEmoji: 'Search emoji',
  noEmoji: 'No emoji found',
  frequentlyUsed: 'Frequently used',
  skinTone: 'Skin tone',
  emojiPicker: 'Emoji picker',
  moreReactions: 'More reactions',
  quickReactions: 'Quick reactions',
  messageActions: 'Message actions',
  attachments: 'Attachments',
  removeAttachment: (name) => `Remove ${name}`,
  suggestions: { mention: 'People', command: 'Commands', emoji: 'Emoji' },
  suggestionVerified: 'Verified',
  searchingSuggestions: 'Searching…',
  noSuggestions: { mention: 'No people found', command: 'No commands found', emoji: 'No emoji found' },
  attachmentItems: { gallery: 'Gallery', camera: 'Camera', file: 'File', location: 'Location', contact: 'Contact', poll: 'Poll', music: 'Music' },
});
