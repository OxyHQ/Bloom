import type { ComponentRef, ReactNode, Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { BloomSize, BloomTone } from '../appearance';

/**
 * Where a voice session is. The composer pill's microphone speaks the same
 * words.
 *
 *   idle          open, nothing captured yet
 *   listening     the microphone is open and the user may speak
 *   transcribing  the user stopped; their speech is becoming text
 *   thinking      the agent is working out a reply
 *   speaking      the agent's reply is being played
 *   error         the session failed; `error` says how
 */
export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

/** The sizes the voice parts draw. */
export type VoiceSize = Exclude<BloomSize, 'xs'>;

/**
 * Audio levels, each `0`–`1`. Either a plain array (state, props) or a
 * reanimated shared value a meter writes into without rendering React — the
 * choice is the caller's, the visualizer reads both the same way.
 */
export type AudioLevels = readonly number[] | SharedValue<readonly number[]>;

export interface AudioWaveVisualizerProps {
  /**
   * One frame of levels (a spectrum, or recent loudness oldest first). Any
   * length: it is resampled to `bars`, so a producer never has to know how many
   * bars are drawn.
   */
  levels: AudioLevels;
  /** Number of bars. Default `24`. */
  bars?: number;
  /**
   * Whether the bars follow `levels`. `false` rests them at their smallest, a
   * row of dots. Default `true`. Reduced motion rests them too.
   */
  active?: boolean;
  /** Bar height and thickness. Default `md`. */
  size?: VoiceSize;
  /** Bar colour, as a semantic tone. Default `neutral`. */
  tone?: BloomTone;
  className?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof View>>;
  testID?: string;
}

export interface VoiceControlsProps {
  /** The session's state: the microphone and pause only work while it is live. Default `listening`. */
  state?: VoiceState;
  /** Whether the microphone is muted. */
  muted?: boolean;
  /** Shows the mute toggle. */
  onMutedChange?: (muted: boolean) => void;
  /** Whether the session is paused. */
  paused?: boolean;
  /** Shows the pause toggle. */
  onPausedChange?: (paused: boolean) => void;
  /** Shows the end button. */
  onEnd?: () => void;
  /** Shows the "type instead" action (the keyboard). */
  onTypeInstead?: () => void;
  /** Disables every control. */
  disabled?: boolean;
  /** Button size. Default `lg`. */
  size?: VoiceSize;
  /** Before the controls, at the row's start. */
  leading?: ReactNode;
  /** After the controls, at the row's end. */
  trailing?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof View>>;
  testID?: string;
}

export interface VoiceOverlayProps {
  open?: boolean;
  defaultOpen?: boolean;
  /** Escape, Android back and the keyboard focus trap all ask to close through here. */
  onOpenChange?: (open: boolean) => void;
  state: VoiceState;
  /** The caption: what the user said, or what the agent is saying. Growth is followed. */
  transcript?: string;
  /** Replaces the transcript with your own caption content. */
  children?: ReactNode;
  /** What went wrong, shown as the status while `state` is `error`. */
  error?: string;
  /** Feeds the wave. See {@link AudioLevels}. */
  levels: AudioLevels;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  onEnd?: () => void;
  onTypeInstead?: () => void;
  /** The dialog's accessible name. Default "Voice mode". */
  label?: string;
  className?: string;
  testID?: string;
}
