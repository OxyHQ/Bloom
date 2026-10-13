import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { VoiceState } from './types';

/**
 * Every fixed string the voice family draws or announces, in each Bloom
 * language. Control names are the ACTION and stay put while the toggle flips:
 * the pressed state says whether it is on.
 */
export interface VoiceMessages {
  /** The overlay's name, as a dialog. */
  voiceMode: string;
  /** `VoiceControls`' name, as a toolbar. */
  controls: string;
  mute: string;
  pause: string;
  end: string;
  typeInstead: string;
  /** The status line per state. */
  status: Record<VoiceState, string>;
  /** The status line while listening with the microphone muted. */
  mutedStatus: string;
}

export const VOICE_MESSAGES: MessageCatalog<VoiceMessages> = defineMessages<VoiceMessages>(
  'VOICE_MESSAGES',
  {
    voiceMode: 'Voice mode',
    controls: 'Voice controls',
    mute: 'Mute microphone',
    pause: 'Pause',
    end: 'End voice session',
    typeInstead: 'Type instead',
    status: {
      idle: 'Ready',
      listening: 'Listening…',
      transcribing: 'Transcribing…',
      thinking: 'Thinking…',
      speaking: 'Speaking…',
      error: 'Something went wrong',
    },
    mutedStatus: 'Microphone muted',
  },
);
